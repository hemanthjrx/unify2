import { Router, type IRouter } from "express";
import {
  db,
  communitiesTable,
  communityMembersTable,
  communityMessagesTable,
  userInterestsTable,
  interestsTable,
  activityTable,
  usersTable,
} from "@workspace/db";
import { and, eq, sql, inArray, desc } from "drizzle-orm";
import { z } from "zod";
import {
  ListCommunitiesResponse,
  DiscoverCommunitiesResponse,
  JoinCommunityResponse,
  LeaveCommunityResponse,
} from "@workspace/api-zod";
import { withCurrentUser } from "../lib/auth";

const router: IRouter = Router();

async function listForViewer(viewerId: number, communityIds?: number[]) {
  const base = db
    .select({
      id: communitiesTable.id,
      slug: communitiesTable.slug,
      name: communitiesTable.name,
      description: communitiesTable.description,
      accentColor: communitiesTable.accentColor,
      icon: communitiesTable.icon,
      imageUrl: communitiesTable.imageUrl,
      bannerImageUrl: communitiesTable.bannerImageUrl,
      profileImageUrl: communitiesTable.profileImageUrl,
      tags: communitiesTable.tags,
      memberCount: sql<number>`(
        select count(*)::int from ${communityMembersTable}
        where ${communityMembersTable.communityId} = ${communitiesTable.id}
      )`.as("member_count"),
      isMember: sql<boolean>`exists (
        select 1 from ${communityMembersTable}
        where ${communityMembersTable.communityId} = ${communitiesTable.id}
        and ${communityMembersTable.userId} = ${viewerId}
      )`.as("is_member"),
    })
    .from(communitiesTable)
    .orderBy(communitiesTable.name);

  if (communityIds && communityIds.length > 0) {
    return base.where(inArray(communitiesTable.id, communityIds));
  }
  return base;
}

router.get("/communities", withCurrentUser, async (req, res) => {
  const rows = await listForViewer(req.currentUserId!);
  res.json(ListCommunitiesResponse.parse(rows));
});

router.get("/discover/communities", withCurrentUser, async (req, res) => {
  // Recommend communities matching viewer's interest tags
  const viewerInterests = await db
    .select({ name: interestsTable.name })
    .from(userInterestsTable)
    .innerJoin(interestsTable, eq(interestsTable.id, userInterestsTable.interestId))
    .where(eq(userInterestsTable.userId, req.currentUserId!));

  const lowerTags = viewerInterests.map((i) => i.name.toLowerCase());

  const all = await listForViewer(req.currentUserId!);
  const scored = all
    .map((c) => {
      const overlap = c.tags.filter((t) => lowerTags.includes(t.toLowerCase())).length;
      return { c, overlap };
    })
    .sort((a, b) => b.overlap - a.overlap || b.c.memberCount - a.c.memberCount)
    .slice(0, 12)
    .map((s) => s.c);

  res.json(DiscoverCommunitiesResponse.parse(scored));
});

router.get("/communities/:slug", withCurrentUser, async (req, res) => {
  const slug = String(req.params.slug);
  const [community] = await db
    .select()
    .from(communitiesTable)
    .where(eq(communitiesTable.slug, slug))
    .limit(1);
  if (!community) {
    res.status(404).json({ error: "not_found" });
    return;
  }
  const [row] = await listForViewer(req.currentUserId!, [community.id]);

  // Recent members (up to 12)
  const members = await db
    .select({
      id: usersTable.id,
      username: usersTable.username,
      avatarColor: usersTable.avatarColor,
      bio: usersTable.bio,
      joinedAt: communityMembersTable.joinedAt,
    })
    .from(communityMembersTable)
    .innerJoin(usersTable, eq(usersTable.id, communityMembersTable.userId))
    .where(eq(communityMembersTable.communityId, community.id))
    .orderBy(sql`${communityMembersTable.joinedAt} desc`)
    .limit(12);

  const detail = {
    ...row,
    members: members.map((m) => ({
      id: m.id,
      username: m.username ?? "anonymous",
      avatarColor: m.avatarColor,
      bio: m.bio,
      joinedAt: m.joinedAt.toISOString(),
    })),
  };
  res.json(detail);
});

router.post("/communities/:id/join", withCurrentUser, async (req, res) => {
  const id = Number(req.params.id);
  const [community] = await db.select().from(communitiesTable).where(eq(communitiesTable.id, id)).limit(1);
  if (!community) {
    res.status(404).json({ error: "not_found" });
    return;
  }

  // Only insert if not already a member — returning tells us if a row was created
  const inserted = await db
    .insert(communityMembersTable)
    .values({ userId: req.currentUserId!, communityId: id })
    .onConflictDoNothing()
    .returning();

  // Only award coins when actually joining (not on duplicate requests)
  if (inserted.length > 0) {
    await db
      .update(usersTable)
      .set({
        coins: sql`${usersTable.coins} + 10`,
        weeklyPoints: sql`${usersTable.weeklyPoints} + 10`,
      })
      .where(eq(usersTable.id, req.currentUserId!));

    await db.insert(activityTable).values({
      actorId: req.currentUserId!,
      kind: "community_join",
      message: `joined ${community.name}`,
      targetName: community.name,
    });
  }

  const [row] = await listForViewer(req.currentUserId!, [id]);
  res.json(JoinCommunityResponse.parse(row));
});

router.post("/communities/:id/leave", withCurrentUser, async (req, res) => {
  const id = Number(req.params.id);

  const deleted = await db
    .delete(communityMembersTable)
    .where(
      and(
        eq(communityMembersTable.userId, req.currentUserId!),
        eq(communityMembersTable.communityId, id),
      ),
    )
    .returning();

  // Only deduct coins when actually leaving (not on duplicate leave requests)
  if (deleted.length > 0) {
    await db
      .update(usersTable)
      .set({
        coins: sql`greatest(${usersTable.coins} - 10, 0)`,
        weeklyPoints: sql`greatest(${usersTable.weeklyPoints} - 10, 0)`,
      })
      .where(eq(usersTable.id, req.currentUserId!));
  }

  const [row] = await listForViewer(req.currentUserId!, [id]);
  if (!row) {
    res.status(404).json({ error: "not_found" });
    return;
  }
  res.json(LeaveCommunityResponse.parse(row));
});

// GET /api/communities/:slug/chat — last 60 messages (newest last)
router.get("/communities/:slug/chat", withCurrentUser, async (req, res) => {
  const [community] = await db
    .select({ id: communitiesTable.id })
    .from(communitiesTable)
    .where(eq(communitiesTable.slug, String(req.params.slug)))
    .limit(1);
  if (!community) { res.status(404).json({ error: "not_found" }); return; }

  const rows = await db
    .select({
      id: communityMessagesTable.id,
      content: communityMessagesTable.content,
      createdAt: communityMessagesTable.createdAt,
      authorId: communityMessagesTable.authorId,
      authorUsername: usersTable.username,
      authorAvatarColor: usersTable.avatarColor,
    })
    .from(communityMessagesTable)
    .innerJoin(usersTable, eq(usersTable.id, communityMessagesTable.authorId))
    .where(eq(communityMessagesTable.communityId, community.id))
    .orderBy(desc(communityMessagesTable.createdAt))
    .limit(60);

  res.json(rows.reverse().map((r) => ({
    id: r.id,
    content: r.content,
    createdAt: r.createdAt.toISOString(),
    author: {
      id: r.authorId,
      username: r.authorUsername ?? "unknown",
      avatarColor: r.authorAvatarColor,
    },
    isOwn: r.authorId === req.currentUserId!,
  })));
});

const ChatMessageBody = z.object({ content: z.string().min(1).max(500) });

// POST /api/communities/:slug/chat — send a message (must be a member)
router.post("/communities/:slug/chat", withCurrentUser, async (req, res) => {
  const parsed = ChatMessageBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "invalid_body" }); return; }

  const [community] = await db
    .select({ id: communitiesTable.id })
    .from(communitiesTable)
    .where(eq(communitiesTable.slug, String(req.params.slug)))
    .limit(1);
  if (!community) { res.status(404).json({ error: "not_found" }); return; }

  const [membership] = await db
    .select()
    .from(communityMembersTable)
    .where(and(eq(communityMembersTable.communityId, community.id), eq(communityMembersTable.userId, req.currentUserId!)))
    .limit(1);
  if (!membership) { res.status(403).json({ error: "not_a_member" }); return; }

  const [created] = await db
    .insert(communityMessagesTable)
    .values({ communityId: community.id, authorId: req.currentUserId!, content: parsed.data.content })
    .returning();

  const [me] = await db
    .select({ username: usersTable.username, avatarColor: usersTable.avatarColor })
    .from(usersTable)
    .where(eq(usersTable.id, req.currentUserId!))
    .limit(1);

  res.json({
    id: created.id,
    content: created.content,
    createdAt: created.createdAt.toISOString(),
    author: { id: req.currentUserId!, username: me?.username ?? "unknown", avatarColor: me?.avatarColor ?? "#7c5cff" },
    isOwn: true,
  });
});

export default router;
