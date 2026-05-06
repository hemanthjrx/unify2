import { Router, type IRouter } from "express";
import {
  db, usersTable, followsTable, userInterestsTable, interestsTable,
  activityTable, notificationsTable,
} from "@workspace/db";
import { and, eq, ne, sql, inArray } from "drizzle-orm";
import { withCurrentUser } from "../lib/auth";
import { buildPublicProfile } from "../lib/profile";

const router: IRouter = Router();

// Discover people
router.get("/discover/people", withCurrentUser, async (req, res) => {
  const viewerId = req.currentUserId!;

  const myInterestIds = await db.select({ id: userInterestsTable.interestId }).from(userInterestsTable).where(eq(userInterestsTable.userId, viewerId));
  const interestIdList = myInterestIds.map((r) => r.id);

  const candidates = await db
    .select({
      id: usersTable.id,
      username: usersTable.username,
      bio: usersTable.bio,
      avatarColor: usersTable.avatarColor,
      coins: usersTable.coins,
      skills: usersTable.skills,
      isPrivate: usersTable.isPrivate,
      sharedCount: interestIdList.length > 0
        ? sql<number>`(select count(*)::int from ${userInterestsTable} ui where ui.user_id = ${usersTable.id} and ui.interest_id = any(${interestIdList}))`.as("shared_count")
        : sql<number>`0`.as("shared_count"),
    })
    .from(usersTable)
    .where(and(ne(usersTable.id, viewerId), sql`${usersTable.username} is not null`))
    .orderBy(sql`shared_count desc`, sql`${usersTable.coins} desc`)
    .limit(20);

  const ids = candidates.map((c) => c.id);
  const followsRows = ids.length > 0
    ? await db.select({ followeeId: followsTable.followeeId, status: followsTable.status }).from(followsTable).where(and(eq(followsTable.followerId, viewerId), inArray(followsTable.followeeId, ids)))
    : [];
  const followMap = new Map(followsRows.map((r) => [r.followeeId, r.status]));

  const myInterestNames = await db.select({ name: interestsTable.name }).from(userInterestsTable).innerJoin(interestsTable, eq(interestsTable.id, userInterestsTable.interestId)).where(eq(userInterestsTable.userId, viewerId));
  const myNameSet = new Set(myInterestNames.map((i) => i.name));

  const sharedByUser = new Map<number, string[]>();
  if (ids.length > 0) {
    const rows = await db.select({ userId: userInterestsTable.userId, name: interestsTable.name }).from(userInterestsTable).innerJoin(interestsTable, eq(interestsTable.id, userInterestsTable.interestId)).where(inArray(userInterestsTable.userId, ids));
    for (const row of rows) {
      if (myNameSet.has(row.name)) {
        const arr = sharedByUser.get(row.userId) ?? [];
        arr.push(row.name);
        sharedByUser.set(row.userId, arr);
      }
    }
  }

  const result = candidates.map((c) => {
    const followStatus = followMap.get(c.id) ?? "none";
    return {
      id: c.id,
      username: c.username!,
      bio: c.bio,
      avatarColor: c.avatarColor,
      coins: c.coins,
      sharedInterests: sharedByUser.get(c.id) ?? [],
      skills: c.skills,
      isPrivate: c.isPrivate,
      isFollowing: followStatus === "accepted",
      followStatus,
    };
  });

  res.json(result);
});

// Get my followers
router.get("/me/followers", withCurrentUser, async (req, res) => {
  const userId = req.currentUserId!;
  const rows = await db
    .select({
      id: usersTable.id,
      username: usersTable.username,
      avatarColor: usersTable.avatarColor,
      followedAt: followsTable.createdAt,
    })
    .from(followsTable)
    .innerJoin(usersTable, eq(usersTable.id, followsTable.followerId))
    .where(and(eq(followsTable.followeeId, userId), eq(followsTable.status, "accepted")))
    .orderBy(sql`${followsTable.createdAt} desc`);

  res.json(rows.map((r) => ({
    id: r.id,
    username: r.username!,
    avatarColor: r.avatarColor,
    followedAt: r.followedAt.toISOString(),
  })));
});

// Remove a follower (they follow me, I remove them)
router.post("/connections/:username/remove-follower", withCurrentUser, async (req, res) => {
  const username = String(req.params.username);
  const [follower] = await db.select().from(usersTable).where(eq(usersTable.username, username)).limit(1);
  if (!follower) { res.status(404).json({ error: "not_found" }); return; }

  await db.delete(followsTable).where(and(eq(followsTable.followerId, follower.id), eq(followsTable.followeeId, req.currentUserId!)));
  res.json({ ok: true });
});

// Get pending follow requests for current user
router.get("/connections/follow-requests", withCurrentUser, async (req, res) => {
  const rows = await db
    .select({ followerId: followsTable.followerId, createdAt: followsTable.createdAt, username: usersTable.username, avatarColor: usersTable.avatarColor })
    .from(followsTable)
    .innerJoin(usersTable, eq(usersTable.id, followsTable.followerId))
    .where(and(eq(followsTable.followeeId, req.currentUserId!), eq(followsTable.status, "pending")));
  res.json(rows.map((r) => ({ userId: r.followerId, username: r.username, avatarColor: r.avatarColor, requestedAt: r.createdAt.toISOString() })));
});

// Follow (or send follow request if private)
router.post("/connections/:username/follow", withCurrentUser, async (req, res) => {
  const username = String(req.params.username);
  const [target] = await db.select().from(usersTable).where(eq(usersTable.username, username)).limit(1);
  if (!target) { res.status(404).json({ error: "not_found" }); return; }
  if (target.id === req.currentUserId) { res.status(400).json({ error: "cannot_follow_self" }); return; }

  const newStatus = target.isPrivate ? "pending" : "accepted";
  const inserted = await db
    .insert(followsTable)
    .values({ followerId: req.currentUserId!, followeeId: target.id, status: newStatus })
    .onConflictDoNothing()
    .returning();

  if (inserted.length > 0) {
    if (newStatus === "accepted") {
      await Promise.all([
        db.insert(activityTable).values({ actorId: req.currentUserId!, kind: "follow", message: `started following @${target.username}`, targetName: target.username }),
        db.insert(notificationsTable).values({ recipientId: target.id, actorId: req.currentUserId!, type: "follow" }),
      ]);
    } else {
      // pending — send follow_request notification
      await db.insert(notificationsTable).values({ recipientId: target.id, actorId: req.currentUserId!, type: "follow_request" });
    }
  }

  const profile = await buildPublicProfile(req.currentUserId!, target.username!);
  res.json(profile);
});

// Accept a follow request (current user accepts from :username)
router.post("/connections/:username/follow/accept", withCurrentUser, async (req, res) => {
  const username = String(req.params.username);
  const [requester] = await db.select().from(usersTable).where(eq(usersTable.username, username)).limit(1);
  if (!requester) { res.status(404).json({ error: "not_found" }); return; }

  const updated = await db
    .update(followsTable)
    .set({ status: "accepted" })
    .where(and(eq(followsTable.followerId, requester.id), eq(followsTable.followeeId, req.currentUserId!), eq(followsTable.status, "pending")))
    .returning();

  if (updated.length > 0) {
    await Promise.all([
      db.insert(activityTable).values({ actorId: requester.id, kind: "follow", message: `started following @${(await db.select({ username: usersTable.username }).from(usersTable).where(eq(usersTable.id, req.currentUserId!)).limit(1))[0]?.username}`, targetName: null }),
      db.insert(notificationsTable).values({ recipientId: requester.id, actorId: req.currentUserId!, type: "follow_accepted" }),
    ]);
  }

  res.json({ ok: true });
});

// Decline a follow request
router.post("/connections/:username/follow/decline", withCurrentUser, async (req, res) => {
  const username = String(req.params.username);
  const [requester] = await db.select().from(usersTable).where(eq(usersTable.username, username)).limit(1);
  if (!requester) { res.status(404).json({ error: "not_found" }); return; }

  await db.delete(followsTable).where(and(eq(followsTable.followerId, requester.id), eq(followsTable.followeeId, req.currentUserId!)));
  res.json({ ok: true });
});

// Unfollow
router.post("/connections/:username/unfollow", withCurrentUser, async (req, res) => {
  const username = String(req.params.username);
  const [target] = await db.select().from(usersTable).where(eq(usersTable.username, username)).limit(1);
  if (!target) { res.status(404).json({ error: "not_found" }); return; }

  await db.delete(followsTable).where(and(eq(followsTable.followerId, req.currentUserId!), eq(followsTable.followeeId, target.id)));
  const profile = await buildPublicProfile(req.currentUserId!, target.username!);
  res.json(profile);
});

export default router;
