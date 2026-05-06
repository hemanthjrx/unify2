import { Router, type IRouter } from "express";
import { db, postsTable, usersTable, postLikesTable, activityTable } from "@workspace/db";
import { and, desc, eq, sql } from "drizzle-orm";
import { withCurrentUser } from "../lib/auth";
import { z } from "zod";

const router: IRouter = Router();

const HackathonPostBody = z.object({
  body: z.string().min(3).max(1000),
  hackathonDate: z.string().optional(),
  hackathonLocation: z.string().max(120).optional(),
  hackathonTeamSize: z.number().int().min(1).max(20).optional(),
  hackathonSkills: z.array(z.string().max(40)).max(10).default([]),
  images: z.array(z.string()).max(5).default([]),
});

router.get("/hackathons", withCurrentUser, async (req, res) => {
  const me = req.currentUserId!;

  const rows = await db
    .select({
      id: postsTable.id,
      body: postsTable.body,
      hackathonDate: postsTable.hackathonDate,
      hackathonLocation: postsTable.hackathonLocation,
      hackathonTeamSize: postsTable.hackathonTeamSize,
      hackathonSkills: postsTable.hackathonSkills,
      hackathonFilled: postsTable.hackathonFilled,
      images: postsTable.images,
      createdAt: postsTable.createdAt,
      authorId: postsTable.authorId,
      authorUsername: usersTable.username,
      authorAvatarColor: usersTable.avatarColor,
      likeCount: sql<number>`(select count(*)::int from ${postLikesTable} where ${postLikesTable.postId} = ${postsTable.id})`.as("like_count"),
      isLiked: sql<boolean>`exists (select 1 from ${postLikesTable} where ${postLikesTable.postId} = ${postsTable.id} and ${postLikesTable.userId} = ${me})`.as("is_liked"),
    })
    .from(postsTable)
    .innerJoin(usersTable, eq(usersTable.id, postsTable.authorId))
    .where(eq(postsTable.kind, "hackathon"))
    .orderBy(desc(postsTable.createdAt))
    .limit(50);

  res.json(rows.map((r) => ({
    id: r.id,
    body: r.body,
    hackathonDate: r.hackathonDate,
    hackathonLocation: r.hackathonLocation,
    hackathonTeamSize: r.hackathonTeamSize,
    hackathonSkills: r.hackathonSkills ?? [],
    hackathonFilled: r.hackathonFilled ?? false,
    images: r.images ?? [],
    createdAt: r.createdAt.toISOString(),
    author: { id: r.authorId, username: r.authorUsername ?? "unknown", avatarColor: r.authorAvatarColor },
    likeCount: r.likeCount,
    isLiked: r.isLiked,
    isOwner: r.authorId === me,
  })));
});

router.post("/hackathons", withCurrentUser, async (req, res) => {
  const parsed = HackathonPostBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "invalid_body", details: parsed.error.issues }); return; }
  const { body, hackathonDate, hackathonLocation, hackathonTeamSize, hackathonSkills, images } = parsed.data;

  const [created] = await db.insert(postsTable).values({
    authorId: req.currentUserId!,
    body,
    kind: "hackathon",
    hackathonDate: hackathonDate ?? null,
    hackathonLocation: hackathonLocation ?? null,
    hackathonTeamSize: hackathonTeamSize ?? null,
    hackathonSkills: hackathonSkills ?? [],
    hackathonFilled: false,
    images: images ?? [],
  }).returning();

  const [me] = await db.select().from(usersTable).where(eq(usersTable.id, req.currentUserId!)).limit(1);
  if (me) {
    await db.update(usersTable).set({ coins: me.coins + 5, weeklyPoints: me.weeklyPoints + 5 }).where(eq(usersTable.id, req.currentUserId!));
    await db.insert(activityTable).values({ actorId: req.currentUserId!, kind: "post", message: "posted a hackathon invite" });
  }

  const [row] = await db
    .select({ id: postsTable.id, body: postsTable.body, hackathonDate: postsTable.hackathonDate, hackathonLocation: postsTable.hackathonLocation, hackathonTeamSize: postsTable.hackathonTeamSize, hackathonSkills: postsTable.hackathonSkills, hackathonFilled: postsTable.hackathonFilled, images: postsTable.images, createdAt: postsTable.createdAt, authorId: postsTable.authorId, authorUsername: usersTable.username, authorAvatarColor: usersTable.avatarColor })
    .from(postsTable)
    .innerJoin(usersTable, eq(usersTable.id, postsTable.authorId))
    .where(eq(postsTable.id, created.id));

  res.json({ id: row.id, body: row.body, hackathonDate: row.hackathonDate, hackathonLocation: row.hackathonLocation, hackathonTeamSize: row.hackathonTeamSize, hackathonSkills: row.hackathonSkills ?? [], hackathonFilled: row.hackathonFilled ?? false, images: row.images ?? [], createdAt: row.createdAt.toISOString(), author: { id: row.authorId, username: row.authorUsername ?? "unknown", avatarColor: row.authorAvatarColor }, likeCount: 0, isLiked: false, isOwner: true });
});

router.patch("/hackathons/:id/status", withCurrentUser, async (req, res) => {
  const id = Number(req.params.id);
  const [post] = await db.select().from(postsTable).where(and(eq(postsTable.id, id), eq(postsTable.kind, "hackathon"))).limit(1);
  if (!post) { res.status(404).json({ error: "not_found" }); return; }
  if (post.authorId !== req.currentUserId!) { res.status(403).json({ error: "forbidden" }); return; }
  const newFilled = !post.hackathonFilled;
  await db.update(postsTable).set({ hackathonFilled: newFilled }).where(eq(postsTable.id, id));
  res.json({ hackathonFilled: newFilled });
});

router.post("/hackathons/:id/like", withCurrentUser, async (req, res) => {
  const id = Number(req.params.id);
  await db.insert(postLikesTable).values({ postId: id, userId: req.currentUserId! }).onConflictDoNothing();
  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(postLikesTable).where(eq(postLikesTable.postId, id));
  res.json({ likeCount: count, isLiked: true });
});

router.delete("/hackathons/:id/like", withCurrentUser, async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(postLikesTable).where(and(eq(postLikesTable.postId, id), eq(postLikesTable.userId, req.currentUserId!)));
  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(postLikesTable).where(eq(postLikesTable.postId, id));
  res.json({ likeCount: count, isLiked: false });
});

router.delete("/hackathons/:id", withCurrentUser, async (req, res) => {
  const id = Number(req.params.id);
  const [post] = await db.select().from(postsTable).where(and(eq(postsTable.id, id), eq(postsTable.kind, "hackathon"))).limit(1);
  if (!post) { res.status(404).json({ error: "not_found" }); return; }
  if (post.authorId !== req.currentUserId!) { res.status(403).json({ error: "forbidden" }); return; }
  await db.delete(postsTable).where(eq(postsTable.id, id));
  res.json({ ok: true });
});

export default router;
