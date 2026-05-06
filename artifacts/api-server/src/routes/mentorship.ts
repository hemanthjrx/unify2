import { Router, type IRouter } from "express";
import {
  db,
  mentorshipQuestionsTable,
  mentorshipRepliesTable,
  usersTable,
} from "@workspace/db";
import { and, eq, sql, desc } from "drizzle-orm";
import { z } from "zod";
import { withCurrentUser } from "../lib/auth";

const router: IRouter = Router();

// GET /api/mentorship — list all questions newest first
router.get("/mentorship", withCurrentUser, async (req, res) => {
  const rows = await db
    .select({
      id: mentorshipQuestionsTable.id,
      title: mentorshipQuestionsTable.title,
      body: mentorshipQuestionsTable.body,
      tags: mentorshipQuestionsTable.tags,
      isSolved: mentorshipQuestionsTable.isSolved,
      createdAt: mentorshipQuestionsTable.createdAt,
      authorId: mentorshipQuestionsTable.authorId,
      authorUsername: usersTable.username,
      authorAvatarColor: usersTable.avatarColor,
      replyCount: sql<number>`(
        select count(*)::int from ${mentorshipRepliesTable}
        where ${mentorshipRepliesTable.questionId} = ${mentorshipQuestionsTable.id}
      )`.as("reply_count"),
    })
    .from(mentorshipQuestionsTable)
    .innerJoin(usersTable, eq(usersTable.id, mentorshipQuestionsTable.authorId))
    .orderBy(desc(mentorshipQuestionsTable.createdAt));

  res.json(rows.map((r) => ({
    id: r.id,
    title: r.title,
    body: r.body,
    tags: r.tags,
    isSolved: r.isSolved,
    createdAt: r.createdAt.toISOString(),
    replyCount: r.replyCount,
    author: { id: r.authorId, username: r.authorUsername ?? "unknown", avatarColor: r.authorAvatarColor },
    isOwn: r.authorId === req.currentUserId!,
  })));
});

// GET /api/mentorship/:id — single question + replies
router.get("/mentorship/:id", withCurrentUser, async (req, res) => {
  const id = Number(req.params.id);
  if (!id) { res.status(400).json({ error: "bad_id" }); return; }

  const [q] = await db
    .select({
      id: mentorshipQuestionsTable.id,
      title: mentorshipQuestionsTable.title,
      body: mentorshipQuestionsTable.body,
      tags: mentorshipQuestionsTable.tags,
      isSolved: mentorshipQuestionsTable.isSolved,
      createdAt: mentorshipQuestionsTable.createdAt,
      authorId: mentorshipQuestionsTable.authorId,
      authorUsername: usersTable.username,
      authorAvatarColor: usersTable.avatarColor,
    })
    .from(mentorshipQuestionsTable)
    .innerJoin(usersTable, eq(usersTable.id, mentorshipQuestionsTable.authorId))
    .where(eq(mentorshipQuestionsTable.id, id));

  if (!q) { res.status(404).json({ error: "not_found" }); return; }

  const replies = await db
    .select({
      id: mentorshipRepliesTable.id,
      content: mentorshipRepliesTable.content,
      isHelpful: mentorshipRepliesTable.isHelpful,
      createdAt: mentorshipRepliesTable.createdAt,
      authorId: mentorshipRepliesTable.authorId,
      authorUsername: usersTable.username,
      authorAvatarColor: usersTable.avatarColor,
    })
    .from(mentorshipRepliesTable)
    .innerJoin(usersTable, eq(usersTable.id, mentorshipRepliesTable.authorId))
    .where(eq(mentorshipRepliesTable.questionId, id))
    .orderBy(mentorshipRepliesTable.createdAt);

  res.json({
    id: q.id,
    title: q.title,
    body: q.body,
    tags: q.tags,
    isSolved: q.isSolved,
    createdAt: q.createdAt.toISOString(),
    author: { id: q.authorId, username: q.authorUsername ?? "unknown", avatarColor: q.authorAvatarColor },
    isOwn: q.authorId === req.currentUserId!,
    replies: replies.map((r) => ({
      id: r.id,
      content: r.content,
      isHelpful: r.isHelpful,
      createdAt: r.createdAt.toISOString(),
      author: { id: r.authorId, username: r.authorUsername ?? "unknown", avatarColor: r.authorAvatarColor },
      isOwn: r.authorId === req.currentUserId!,
    })),
  });
});

const QuestionBody = z.object({
  title: z.string().min(3).max(200),
  body: z.string().min(5).max(2000),
  tags: z.array(z.string()).max(5).default([]),
});

// POST /api/mentorship — post a new question
router.post("/mentorship", withCurrentUser, async (req, res) => {
  const parsed = QuestionBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "invalid_body", details: parsed.error.flatten() }); return; }

  const [created] = await db
    .insert(mentorshipQuestionsTable)
    .values({ authorId: req.currentUserId!, ...parsed.data })
    .returning();

  res.status(201).json({ id: created.id });
});

// DELETE /api/mentorship/:id — delete own question
router.delete("/mentorship/:id", withCurrentUser, async (req, res) => {
  const id = Number(req.params.id);
  const [q] = await db
    .select({ authorId: mentorshipQuestionsTable.authorId })
    .from(mentorshipQuestionsTable)
    .where(eq(mentorshipQuestionsTable.id, id));
  if (!q) { res.status(404).json({ error: "not_found" }); return; }
  if (q.authorId !== req.currentUserId!) { res.status(403).json({ error: "forbidden" }); return; }
  await db.delete(mentorshipQuestionsTable).where(eq(mentorshipQuestionsTable.id, id));
  res.json({ ok: true });
});

const ReplyBody = z.object({ content: z.string().min(10).max(2000) });

// POST /api/mentorship/:id/replies — post a reply
router.post("/mentorship/:id/replies", withCurrentUser, async (req, res) => {
  const questionId = Number(req.params.id);
  const parsed = ReplyBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "invalid_body" }); return; }

  const [q] = await db
    .select({ authorId: mentorshipQuestionsTable.authorId })
    .from(mentorshipQuestionsTable)
    .where(eq(mentorshipQuestionsTable.id, questionId));
  if (!q) { res.status(404).json({ error: "not_found" }); return; }

  const [created] = await db
    .insert(mentorshipRepliesTable)
    .values({ questionId, authorId: req.currentUserId!, content: parsed.data.content })
    .returning();

  res.status(201).json({ id: created.id });
});

// POST /api/mentorship/:id/replies/:replyId/helpful — mark helpful (+5 coins to replier)
router.post("/mentorship/:id/replies/:replyId/helpful", withCurrentUser, async (req, res) => {
  const questionId = Number(req.params.id);
  const replyId = Number(req.params.replyId);

  const [q] = await db
    .select({ authorId: mentorshipQuestionsTable.authorId, isSolved: mentorshipQuestionsTable.isSolved })
    .from(mentorshipQuestionsTable)
    .where(eq(mentorshipQuestionsTable.id, questionId));

  if (!q) { res.status(404).json({ error: "not_found" }); return; }
  if (q.authorId !== req.currentUserId!) { res.status(403).json({ error: "only_question_author" }); return; }
  if (q.isSolved) { res.status(409).json({ error: "already_solved" }); return; }

  const [reply] = await db
    .select({ authorId: mentorshipRepliesTable.authorId })
    .from(mentorshipRepliesTable)
    .where(and(eq(mentorshipRepliesTable.id, replyId), eq(mentorshipRepliesTable.questionId, questionId)));

  if (!reply) { res.status(404).json({ error: "reply_not_found" }); return; }

  // Mark reply as helpful
  await db.update(mentorshipRepliesTable).set({ isHelpful: true }).where(eq(mentorshipRepliesTable.id, replyId));
  // Mark question as solved
  await db.update(mentorshipQuestionsTable).set({ isSolved: true }).where(eq(mentorshipQuestionsTable.id, questionId));
  // Award 5 coins to the replier (but not if they replied to their own question)
  if (reply.authorId !== req.currentUserId!) {
    await db
      .update(usersTable)
      .set({ coins: sql`${usersTable.coins} + 5` })
      .where(eq(usersTable.id, reply.authorId));
  }

  res.json({ ok: true });
});

export default router;
