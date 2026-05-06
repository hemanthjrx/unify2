import { Router, type IRouter } from "express";
import { z } from "zod";
import {
  db,
  postsTable,
  postLikesTable,
  postCommentsTable,
  usersTable,
  communitiesTable,
  communityMembersTable,
  followsTable,
  activityTable,
  notificationsTable,
} from "@workspace/db";
import { and, desc, eq, inArray, or, sql } from "drizzle-orm";
import { CreatePostBody } from "@workspace/api-zod";
import { withCurrentUser } from "../lib/auth";

const router: IRouter = Router();

const MAX_POST_LENGTH = 600;

async function fetchPostsByIds(viewerId: number, postIds: number[]) {
  if (postIds.length === 0) return [];
  const rows = await db
    .select({
      id: postsTable.id,
      body: postsTable.body,
      createdAt: postsTable.createdAt,
      authorId: postsTable.authorId,
      authorUsername: usersTable.username,
      authorAvatarColor: usersTable.avatarColor,
      authorBio: usersTable.bio,
      communityId: postsTable.communityId,
      communitySlug: communitiesTable.slug,
      communityName: communitiesTable.name,
      communityAccentColor: communitiesTable.accentColor,
      likeCount: sql<number>`(
        select count(*)::int from ${postLikesTable}
        where ${postLikesTable.postId} = ${postsTable.id}
      )`.as("like_count"),
      commentCount: sql<number>`(
        select count(*)::int from ${postCommentsTable}
        where ${postCommentsTable.postId} = ${postsTable.id}
      )`.as("comment_count"),
      isLiked: sql<boolean>`exists (
        select 1 from ${postLikesTable}
        where ${postLikesTable.postId} = ${postsTable.id}
        and ${postLikesTable.userId} = ${viewerId}
      )`.as("is_liked"),
    })
    .from(postsTable)
    .innerJoin(usersTable, eq(usersTable.id, postsTable.authorId))
    .leftJoin(communitiesTable, eq(communitiesTable.id, postsTable.communityId))
    .where(inArray(postsTable.id, postIds));

  // preserve incoming order
  const order = new Map(postIds.map((id, i) => [id, i]));
  return rows
    .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
    .map((r) => ({
      id: r.id,
      body: r.body,
      createdAt: r.createdAt.toISOString(),
      author: {
        id: r.authorId,
        username: r.authorUsername ?? "anonymous",
        avatarColor: r.authorAvatarColor,
        bio: r.authorBio,
      },
      community:
        r.communityId && r.communitySlug && r.communityName
          ? {
              id: r.communityId,
              slug: r.communitySlug,
              name: r.communityName,
              accentColor: r.communityAccentColor ?? "#7c5cff",
            }
          : null,
      likeCount: r.likeCount,
      commentCount: r.commentCount,
      isLiked: r.isLiked,
    }));
}

async function listFeedIds(viewerId: number, limit: number) {
  // posts from people I follow OR communities I'm a member of OR my own
  const ids = await db
    .select({ id: postsTable.id })
    .from(postsTable)
    .where(
      or(
        eq(postsTable.authorId, viewerId),
        sql`${postsTable.authorId} in (
          select ${followsTable.followeeId} from ${followsTable}
          where ${followsTable.followerId} = ${viewerId}
        )`,
        sql`${postsTable.communityId} in (
          select ${communityMembersTable.communityId} from ${communityMembersTable}
          where ${communityMembersTable.userId} = ${viewerId}
        )`,
      ),
    )
    .orderBy(desc(postsTable.createdAt))
    .limit(limit);
  return ids.map((r) => r.id);
}

router.get("/posts/feed", withCurrentUser, async (req, res) => {
  const ids = await listFeedIds(req.currentUserId!, 30);
  const rows = await fetchPostsByIds(req.currentUserId!, ids);
  res.json(rows);
});

router.get("/posts/community/:slug", withCurrentUser, async (req, res) => {
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
  const ids = await db
    .select({ id: postsTable.id })
    .from(postsTable)
    .where(eq(postsTable.communityId, community.id))
    .orderBy(desc(postsTable.createdAt))
    .limit(50);
  const rows = await fetchPostsByIds(req.currentUserId!, ids.map((r) => r.id));
  res.json(rows);
});

router.get("/posts/user/:username", withCurrentUser, async (req, res) => {
  const username = String(req.params.username);
  const [target] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, username))
    .limit(1);
  if (!target) {
    res.status(404).json({ error: "not_found" });
    return;
  }
  const ids = await db
    .select({ id: postsTable.id })
    .from(postsTable)
    .where(eq(postsTable.authorId, target.id))
    .orderBy(desc(postsTable.createdAt))
    .limit(50);
  const rows = await fetchPostsByIds(req.currentUserId!, ids.map((r) => r.id));
  res.json(rows);
});

router.post("/posts", withCurrentUser, async (req, res) => {
  const parsed = CreatePostBody.extend({
    images: z.array(z.string()).max(5).optional(),
  }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_body", details: parsed.error.issues });
    return;
  }
  const body = parsed.data.body.trim();
  if (!body || body.length > MAX_POST_LENGTH) {
    res.status(400).json({ error: "invalid_body" });
    return;
  }
  const images = parsed.data.images ?? [];

  let communityId: number | null = null;
  let communityName: string | null = null;
  if (parsed.data.communitySlug) {
    const [c] = await db
      .select()
      .from(communitiesTable)
      .where(eq(communitiesTable.slug, parsed.data.communitySlug))
      .limit(1);
    if (!c) {
      res.status(404).json({ error: "community_not_found" });
      return;
    }
    // must be a member to post
    const [member] = await db
      .select()
      .from(communityMembersTable)
      .where(
        and(
          eq(communityMembersTable.userId, req.currentUserId!),
          eq(communityMembersTable.communityId, c.id),
        ),
      )
      .limit(1);
    if (!member) {
      res.status(403).json({ error: "not_a_member" });
      return;
    }
    communityId = c.id;
    communityName = c.name;
  }

  const [created] = await db
    .insert(postsTable)
    .values({
      authorId: req.currentUserId!,
      communityId,
      body,
      images,
    })
    .returning();

  // reward 2 coins for posting
  const [me] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.currentUserId!))
    .limit(1);
  if (me) {
    await db
      .update(usersTable)
      .set({ coins: me.coins + 2, weeklyPoints: me.weeklyPoints + 2 })
      .where(eq(usersTable.id, req.currentUserId!));

    await db.insert(activityTable).values({
      actorId: req.currentUserId!,
      kind: communityId ? "community_post" : "post",
      message: communityName ? `posted in ${communityName}` : "shared a post",
      targetName: communityName,
    });
  }

  const [row] = await fetchPostsByIds(req.currentUserId!, [created.id]);
  res.json(row);
});

router.delete("/posts/:id", withCurrentUser, async (req, res) => {
  const id = Number(req.params.id);
  const [post] = await db.select().from(postsTable).where(eq(postsTable.id, id)).limit(1);
  if (!post) {
    res.status(404).json({ error: "not_found" });
    return;
  }
  if (post.authorId !== req.currentUserId!) {
    res.status(403).json({ error: "forbidden" });
    return;
  }
  await db.delete(postsTable).where(eq(postsTable.id, id));
  res.json({ ok: true });
});

router.post("/posts/:id/like", withCurrentUser, async (req, res) => {
  const id = Number(req.params.id);
  const [post] = await db.select().from(postsTable).where(eq(postsTable.id, id)).limit(1);
  if (!post) {
    res.status(404).json({ error: "not_found" });
    return;
  }
  const inserted = await db
    .insert(postLikesTable)
    .values({ postId: id, userId: req.currentUserId! })
    .onConflictDoNothing()
    .returning();

  // notify post author (not self-likes)
  if (inserted.length > 0 && post.authorId !== req.currentUserId!) {
    await db.insert(notificationsTable).values({
      recipientId: post.authorId,
      actorId: req.currentUserId!,
      type: "like",
      postId: id,
    });
  }

  const [row] = await fetchPostsByIds(req.currentUserId!, [id]);
  res.json(row);
});

router.delete("/posts/:id/like", withCurrentUser, async (req, res) => {
  const id = Number(req.params.id);
  await db
    .delete(postLikesTable)
    .where(
      and(
        eq(postLikesTable.postId, id),
        eq(postLikesTable.userId, req.currentUserId!),
      ),
    );
  const [row] = await fetchPostsByIds(req.currentUserId!, [id]);
  if (!row) {
    res.status(404).json({ error: "not_found" });
    return;
  }
  res.json(row);
});

router.get("/posts/:id/comments", withCurrentUser, async (req, res) => {
  const id = Number(req.params.id);
  const rows = await db
    .select({
      id: postCommentsTable.id,
      body: postCommentsTable.body,
      createdAt: postCommentsTable.createdAt,
      authorUsername: usersTable.username,
      authorAvatarColor: usersTable.avatarColor,
    })
    .from(postCommentsTable)
    .innerJoin(usersTable, eq(usersTable.id, postCommentsTable.authorId))
    .where(eq(postCommentsTable.postId, id))
    .orderBy(postCommentsTable.createdAt);

  res.json(
    rows.map((r) => ({
      id: r.id,
      body: r.body,
      createdAt: r.createdAt.toISOString(),
      author: {
        username: r.authorUsername ?? "anonymous",
        avatarColor: r.authorAvatarColor,
      },
    })),
  );
});

router.post("/posts/:id/comments", withCurrentUser, async (req, res) => {
  const id = Number(req.params.id);
  const body = String(req.body?.body ?? "").trim();
  if (!body || body.length > 500) {
    res.status(400).json({ error: "invalid_body" });
    return;
  }

  const [post] = await db.select().from(postsTable).where(eq(postsTable.id, id)).limit(1);
  if (!post) {
    res.status(404).json({ error: "not_found" });
    return;
  }

  const [comment] = await db
    .insert(postCommentsTable)
    .values({ postId: id, authorId: req.currentUserId!, body })
    .returning();

  // notify post author (not self-comments)
  if (post.authorId !== req.currentUserId!) {
    await db.insert(notificationsTable).values({
      recipientId: post.authorId,
      actorId: req.currentUserId!,
      type: "comment",
      postId: id,
    });
  }

  const [me] = await db.select({ username: usersTable.username, avatarColor: usersTable.avatarColor })
    .from(usersTable).where(eq(usersTable.id, req.currentUserId!)).limit(1);

  res.json({
    id: comment.id,
    body: comment.body,
    createdAt: comment.createdAt.toISOString(),
    author: { username: me?.username ?? "anonymous", avatarColor: me?.avatarColor ?? "#7c5cff" },
  });
});

export default router;
