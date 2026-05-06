import { Router, type IRouter } from "express";
import {
  db,
  notificationsTable,
  usersTable,
  postsTable,
} from "@workspace/db";
import { and, desc, eq } from "drizzle-orm";
import { withCurrentUser } from "../lib/auth";

const router: IRouter = Router();

router.get("/notifications", withCurrentUser, async (req, res) => {
  const rows = await db
    .select({
      id: notificationsTable.id,
      type: notificationsTable.type,
      read: notificationsTable.read,
      createdAt: notificationsTable.createdAt,
      postId: notificationsTable.postId,
      actorUsername: usersTable.username,
      actorAvatarColor: usersTable.avatarColor,
    })
    .from(notificationsTable)
    .innerJoin(usersTable, eq(usersTable.id, notificationsTable.actorId))
    .where(eq(notificationsTable.recipientId, req.currentUserId!))
    .orderBy(desc(notificationsTable.createdAt))
    .limit(50);

  // fetch post snippets for like notifications
  const postIds = rows
    .filter((r) => r.postId != null)
    .map((r) => r.postId as number);

  const postMap = new Map<number, { id: number; body: string }>();
  if (postIds.length > 0) {
    const posts = await db
      .select({ id: postsTable.id, body: postsTable.body })
      .from(postsTable)
      .where(
        postIds.length === 1
          ? eq(postsTable.id, postIds[0]!)
          : eq(postsTable.id, postIds[0]!),
      );
    // fetch all by iterating (simple approach for now)
    const allPosts = await db
      .select({ id: postsTable.id, body: postsTable.body })
      .from(postsTable);
    for (const p of allPosts) {
      if (postIds.includes(p.id)) postMap.set(p.id, p);
    }
  }

  const result = rows.map((r) => ({
    id: r.id,
    type: r.type as "follow" | "like" | "comment",
    read: r.read,
    createdAt: r.createdAt.toISOString(),
    actor: {
      username: r.actorUsername ?? "unknown",
      avatarColor: r.actorAvatarColor,
    },
    post: r.postId != null ? (postMap.get(r.postId) ?? null) : null,
  }));

  res.json(result);
});

router.post("/notifications/read-all", withCurrentUser, async (req, res) => {
  await db
    .update(notificationsTable)
    .set({ read: true })
    .where(
      and(
        eq(notificationsTable.recipientId, req.currentUserId!),
        eq(notificationsTable.read, false),
      ),
    );
  res.json({ ok: true });
});

export default router;
