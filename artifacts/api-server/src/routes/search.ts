import { Router, type IRouter } from "express";
import {
  db,
  usersTable,
  communitiesTable,
  followsTable,
  communityMembersTable,
} from "@workspace/db";
import { and, eq, ilike, ne, or, sql, inArray } from "drizzle-orm";
import { withCurrentUser } from "../lib/auth";

const router: IRouter = Router();

router.get("/search", withCurrentUser, async (req, res) => {
  const q = String(req.query.q ?? "").trim();
  if (!q || q.length < 1) {
    res.json({ users: [], communities: [] });
    return;
  }

  const pattern = `%${q}%`;
  const viewerId = req.currentUserId!;

  const userConditions = [
    ne(usersTable.id, viewerId),
    sql`${usersTable.username} is not null`,
    or(
      ilike(usersTable.username, pattern),
      ilike(usersTable.bio, pattern),
    ),
  ];

  const [userRows, communityRows] = await Promise.all([
    db
      .select({
        id: usersTable.id,
        username: usersTable.username,
        bio: usersTable.bio,
        avatarColor: usersTable.avatarColor,
        coins: usersTable.coins,
      })
      .from(usersTable)
      .where(and(...userConditions))
      .limit(10),

    db
      .select({
        id: communitiesTable.id,
        slug: communitiesTable.slug,
        name: communitiesTable.name,
        description: communitiesTable.description,
        accentColor: communitiesTable.accentColor,
        memberCount: sql<number>`(
          select count(*)::int from ${communityMembersTable}
          where ${communityMembersTable.communityId} = ${communitiesTable.id}
        )`.as("member_count"),
      })
      .from(communitiesTable)
      .where(
        or(
          ilike(communitiesTable.name, pattern),
          ilike(communitiesTable.description, pattern),
        ),
      )
      .limit(10),
  ]);

  const userIds = userRows.map((u) => u.id);
  const communityIds = communityRows.map((c) => c.id);

  const [followRows, memberRows] = await Promise.all([
    userIds.length > 0
      ? db
          .select({ followeeId: followsTable.followeeId })
          .from(followsTable)
          .where(eq(followsTable.followerId, viewerId))
      : Promise.resolve([]),
    communityIds.length > 0
      ? db
          .select({ communityId: communityMembersTable.communityId })
          .from(communityMembersTable)
          .where(eq(communityMembersTable.userId, viewerId))
      : Promise.resolve([]),
  ]);

  const followingSet = new Set(followRows.map((r) => r.followeeId));
  const memberSet = new Set(memberRows.map((r) => r.communityId));

  res.json({
    users: userRows.map((u) => ({
      id: u.id,
      username: u.username!,
      bio: u.bio,
      avatarColor: u.avatarColor,
      coins: u.coins,
      isFollowing: followingSet.has(u.id),
    })),
    communities: communityRows.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      description: c.description,
      memberCount: c.memberCount,
      accentColor: c.accentColor,
      isMember: memberSet.has(c.id),
    })),
  });
});

router.get("/students", withCurrentUser, async (req, res) => {
  const branch = req.query.branch ? String(req.query.branch).trim().toUpperCase() : undefined;
  const studyYear = req.query.studyYear ? Number(req.query.studyYear) : undefined;

  const viewerId = req.currentUserId!;
  const userConditions = [
    ne(usersTable.id, viewerId),
    sql`${usersTable.username} is not null`,
  ];

  if (branch) {
    userConditions.push(eq(usersTable.branch, branch));
  }
  if (studyYear && studyYear >= 1 && studyYear <= 4) {
    const startSem = (studyYear - 1) * 2 + 1;
    const endSem = studyYear * 2;
    userConditions.push(sql`${usersTable.semester}::int >= ${startSem} and ${usersTable.semester}::int <= ${endSem}`);
  }

  const userRows = await db
    .select({
      id: usersTable.id,
      username: usersTable.username,
      bio: usersTable.bio,
      avatarColor: usersTable.avatarColor,
      coins: usersTable.coins,
    })
    .from(usersTable)
    .where(and(...userConditions))
    .limit(100);

  const userIds = userRows.map((u) => u.id);
  const followRows = userIds.length > 0
    ? await db
        .select({ followeeId: followsTable.followeeId })
        .from(followsTable)
        .where(eq(followsTable.followerId, viewerId))
    : [];

  const followingSet = new Set(followRows.map((r) => r.followeeId));

  res.json(
    userRows.map((u) => ({
      id: u.id,
      username: u.username!,
      bio: u.bio,
      avatarColor: u.avatarColor,
      coins: u.coins,
      isFollowing: followingSet.has(u.id),
    })),
  );
});

export default router;
