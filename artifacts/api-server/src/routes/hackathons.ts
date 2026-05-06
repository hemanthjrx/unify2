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
  hackathonCollegeName: z.string().max(200).optional().nullable(),
  hackathonRegistrationFee: z.string().max(100).optional().nullable(),
  hackathonProblemStatement: z.string().max(2000).optional().nullable(),
  hackathonRegistrationLink: z.string().max(500).optional().nullable(),
  hackathonLocationLink: z.string().max(500).optional().nullable(),
  images: z.array(z.string()).max(5).default([]),
});

function mapRow(r: {
  id: number; body: string; hackathonDate: string | null; hackathonLocation: string | null;
  hackathonTeamSize: number | null; hackathonSkills: string[] | null; hackathonFilled: boolean | null;
  hackathonCollegeName: string | null; hackathonRegistrationFee: string | null;
  hackathonProblemStatement: string | null; hackathonRegistrationLink: string | null;
  hackathonLocationLink: string | null; images: string[] | null;
  createdAt: Date; authorId: number; authorUsername: string | null; authorAvatarColor: string | null;
  likeCount?: number; isLiked?: boolean;
}, me: number, extra?: { likeCount: number; isLiked: boolean }) {
  return {
    id: r.id,
    body: r.body,
    hackathonDate: r.hackathonDate,
    hackathonLocation: r.hackathonLocation,
    hackathonTeamSize: r.hackathonTeamSize,
    hackathonSkills: r.hackathonSkills ?? [],
    hackathonFilled: r.hackathonFilled ?? false,
    hackathonCollegeName: r.hackathonCollegeName,
    hackathonRegistrationFee: r.hackathonRegistrationFee,
    hackathonProblemStatement: r.hackathonProblemStatement,
    hackathonRegistrationLink: r.hackathonRegistrationLink,
    hackathonLocationLink: r.hackathonLocationLink,
    images: r.images ?? [],
    createdAt: r.createdAt.toISOString(),
    author: { id: r.authorId, username: r.authorUsername ?? "unknown", avatarColor: r.authorAvatarColor },
    likeCount: extra?.likeCount ?? (r as { likeCount?: number }).likeCount ?? 0,
    isLiked: extra?.isLiked ?? (r as { isLiked?: boolean }).isLiked ?? false,
    isOwner: r.authorId === me,
  };
}

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
      hackathonCollegeName: postsTable.hackathonCollegeName,
      hackathonRegistrationFee: postsTable.hackathonRegistrationFee,
      hackathonProblemStatement: postsTable.hackathonProblemStatement,
      hackathonRegistrationLink: postsTable.hackathonRegistrationLink,
      hackathonLocationLink: postsTable.hackathonLocationLink,
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

  res.json(rows.map((r) => mapRow(r, me)));
});

router.post("/hackathons", withCurrentUser, async (req, res) => {
  const parsed = HackathonPostBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "invalid_body", details: parsed.error.issues }); return; }
  const {
    body, hackathonDate, hackathonLocation, hackathonTeamSize, hackathonSkills,
    hackathonCollegeName, hackathonRegistrationFee, hackathonProblemStatement,
    hackathonRegistrationLink, hackathonLocationLink, images,
  } = parsed.data;

  const [created] = await db.insert(postsTable).values({
    authorId: req.currentUserId!,
    body,
    kind: "hackathon",
    hackathonDate: hackathonDate ?? null,
    hackathonLocation: hackathonLocation ?? null,
    hackathonTeamSize: hackathonTeamSize ?? null,
    hackathonSkills: hackathonSkills ?? [],
    hackathonFilled: false,
    hackathonCollegeName: hackathonCollegeName ?? null,
    hackathonRegistrationFee: hackathonRegistrationFee ?? null,
    hackathonProblemStatement: hackathonProblemStatement ?? null,
    hackathonRegistrationLink: hackathonRegistrationLink ?? null,
    hackathonLocationLink: hackathonLocationLink ?? null,
    images: images ?? [],
  }).returning();

  const me = req.currentUserId!;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, me)).limit(1);
  if (user) {
    await db.update(usersTable).set({ coins: user.coins + 5, weeklyPoints: user.weeklyPoints + 5 }).where(eq(usersTable.id, me));
    await db.insert(activityTable).values({ actorId: me, kind: "post", message: "posted a hackathon invite" });
  }

  const [row] = await db
    .select({
      id: postsTable.id, body: postsTable.body,
      hackathonDate: postsTable.hackathonDate, hackathonLocation: postsTable.hackathonLocation,
      hackathonTeamSize: postsTable.hackathonTeamSize, hackathonSkills: postsTable.hackathonSkills,
      hackathonFilled: postsTable.hackathonFilled,
      hackathonCollegeName: postsTable.hackathonCollegeName,
      hackathonRegistrationFee: postsTable.hackathonRegistrationFee,
      hackathonProblemStatement: postsTable.hackathonProblemStatement,
      hackathonRegistrationLink: postsTable.hackathonRegistrationLink,
      hackathonLocationLink: postsTable.hackathonLocationLink,
      images: postsTable.images, createdAt: postsTable.createdAt,
      authorId: postsTable.authorId, authorUsername: usersTable.username, authorAvatarColor: usersTable.avatarColor,
    })
    .from(postsTable)
    .innerJoin(usersTable, eq(usersTable.id, postsTable.authorId))
    .where(eq(postsTable.id, created.id));

  res.json(mapRow(row, me, { likeCount: 0, isLiked: false }));
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
  const me = req.currentUserId!;
  const postId = Number(req.params.id);
  const [existing] = await db.select().from(postLikesTable).where(and(eq(postLikesTable.postId, postId), eq(postLikesTable.userId, me))).limit(1);
  if (existing) { res.status(409).json({ error: "already_liked" }); return; }
  await db.insert(postLikesTable).values({ postId, userId: me });
  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(postLikesTable).where(eq(postLikesTable.postId, postId));
  res.json({ likeCount: count, isLiked: true });
});

router.delete("/hackathons/:id/like", withCurrentUser, async (req, res) => {
  const me = req.currentUserId!;
  const postId = Number(req.params.id);
  await db.delete(postLikesTable).where(and(eq(postLikesTable.postId, postId), eq(postLikesTable.userId, me)));
  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(postLikesTable).where(eq(postLikesTable.postId, postId));
  res.json({ likeCount: count, isLiked: false });
});

router.delete("/hackathons/:id", withCurrentUser, async (req, res) => {
  const me = req.currentUserId!;
  const id = Number(req.params.id);
  const [post] = await db.select({ authorId: postsTable.authorId }).from(postsTable).where(and(eq(postsTable.id, id), eq(postsTable.kind, "hackathon"))).limit(1);
  if (!post) { res.status(404).json({ error: "not_found" }); return; }
  if (post.authorId !== me) { res.status(403).json({ error: "forbidden" }); return; }
  await db.delete(postsTable).where(eq(postsTable.id, id));
  res.status(204).send();
});

export default router;
