import { Router, type IRouter } from "express";
import {
  db,
  announcementsTable,
  announcementLikesTable,
  announcementCommentsTable,
  usersTable,
  notificationsTable,
} from "@workspace/db";
import { and, desc, eq, sql } from "drizzle-orm";
import { withCurrentUser, withAdminUser } from "../lib/auth";
import { z } from "zod";

const router: IRouter = Router();

async function fetchAnnouncements(viewerId: number) {
  const rows = await db
    .select({
      id: announcementsTable.id,
      title: announcementsTable.title,
      body: announcementsTable.body,
      images: announcementsTable.images,
      createdAt: announcementsTable.createdAt,
      authorId: announcementsTable.authorId,
      authorUsername: usersTable.username,
      authorAvatarColor: usersTable.avatarColor,
      likeCount: sql<number>`(select count(*)::int from announcement_likes where announcement_id = ${announcementsTable.id})`.as("like_count"),
      commentCount: sql<number>`(select count(*)::int from announcement_comments where announcement_id = ${announcementsTable.id})`.as("comment_count"),
      isLiked: sql<boolean>`exists(select 1 from announcement_likes where announcement_id = ${announcementsTable.id} and user_id = ${viewerId})`.as("is_liked"),
    })
    .from(announcementsTable)
    .innerJoin(usersTable, eq(usersTable.id, announcementsTable.authorId))
    .orderBy(desc(announcementsTable.createdAt));

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    body: r.body,
    images: r.images ?? [],
    createdAt: r.createdAt.toISOString(),
    author: { username: r.authorUsername ?? "admin", avatarColor: r.authorAvatarColor },
    likeCount: r.likeCount,
    commentCount: r.commentCount,
    isLiked: r.isLiked,
  }));
}

router.get("/announcements", withCurrentUser, async (req, res) => {
  const list = await fetchAnnouncements(req.currentUserId!);
  res.json(list);
});

router.post("/announcements", withAdminUser, async (req, res) => {
  const body = z.object({
    title: z.string().min(1).max(200),
    body: z.string().min(1).max(2000),
    images: z.array(z.string()).max(5).default([]),
  }).parse(req.body);

  const [created] = await db
    .insert(announcementsTable)
    .values({ authorId: req.currentUserId!, title: body.title, body: body.body, images: body.images })
    .returning();

  const [list] = await fetchAnnouncements(req.currentUserId!).then((r) => r.filter((a) => a.id === created.id));
  res.json(list);
});

router.delete("/announcements/:id", withAdminUser, async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(announcementsTable).where(eq(announcementsTable.id, id));
  res.status(204).send();
});

router.post("/announcements/:id/like", withCurrentUser, async (req, res) => {
  const id = Number(req.params.id);
  await db.insert(announcementLikesTable).values({ announcementId: id, userId: req.currentUserId! }).onConflictDoNothing();
  const [row] = await fetchAnnouncements(req.currentUserId!).then((r) => r.filter((a) => a.id === id));
  res.json(row ?? { id });
});

router.delete("/announcements/:id/like", withCurrentUser, async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(announcementLikesTable).where(and(eq(announcementLikesTable.announcementId, id), eq(announcementLikesTable.userId, req.currentUserId!)));
  const [row] = await fetchAnnouncements(req.currentUserId!).then((r) => r.filter((a) => a.id === id));
  res.json(row ?? { id });
});

router.get("/announcements/:id/comments", withCurrentUser, async (req, res) => {
  const id = Number(req.params.id);
  const rows = await db
    .select({
      id: announcementCommentsTable.id,
      body: announcementCommentsTable.body,
      createdAt: announcementCommentsTable.createdAt,
      authorUsername: usersTable.username,
      authorAvatarColor: usersTable.avatarColor,
    })
    .from(announcementCommentsTable)
    .innerJoin(usersTable, eq(usersTable.id, announcementCommentsTable.authorId))
    .where(eq(announcementCommentsTable.announcementId, id))
    .orderBy(announcementCommentsTable.createdAt);

  res.json(rows.map((r) => ({
    id: r.id,
    body: r.body,
    createdAt: r.createdAt.toISOString(),
    author: { username: r.authorUsername ?? "anonymous", avatarColor: r.authorAvatarColor },
  })));
});

router.post("/announcements/:id/comments", withCurrentUser, async (req, res) => {
  const id = Number(req.params.id);
  const bodyText = String(req.body?.body ?? "").trim();
  if (!bodyText || bodyText.length > 500) {
    res.status(400).json({ error: "invalid_body" });
    return;
  }

  const [comment] = await db
    .insert(announcementCommentsTable)
    .values({ announcementId: id, authorId: req.currentUserId!, body: bodyText })
    .returning();

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
