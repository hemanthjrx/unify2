import { Router, type IRouter } from "express";
import { db, usersTable, followsTable, messagesTable } from "@workspace/db";
import { and, desc, eq, or, sql } from "drizzle-orm";
import { withCurrentUser } from "../lib/auth";
import multer from "multer";
import { extname, join } from "path";
import { randomUUID } from "crypto";
import { UPLOAD_DIR } from "../app";

const router: IRouter = Router();

const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".pdf", ".doc", ".docx"]);
const MAX_PENDING_MESSAGES = 3;

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = extname(file.originalname).toLowerCase();
    cb(null, `${randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (_req, file, cb) => {
    const ext = extname(file.originalname).toLowerCase();
    if (ALLOWED_EXTENSIONS.has(ext)) cb(null, true);
    else cb(new Error("File type not allowed"));
  },
});

function getFileKind(filename: string): "image" | "pdf" | "document" {
  const ext = extname(filename).toLowerCase();
  if ([".jpg", ".jpeg", ".png", ".gif", ".webp"].includes(ext)) return "image";
  if (ext === ".pdf") return "pdf";
  return "document";
}

async function getFollowRelationship(userA: number, userB: number) {
  const rows = await db
    .select({ followerId: followsTable.followerId, followeeId: followsTable.followeeId, status: followsTable.status })
    .from(followsTable)
    .where(
      or(
        and(eq(followsTable.followerId, userA), eq(followsTable.followeeId, userB)),
        and(eq(followsTable.followerId, userB), eq(followsTable.followeeId, userA)),
      ),
    );
  const accepted = rows.some((r) => r.status === "accepted");
  const pendingFromA = rows.find((r) => r.followerId === userA && r.status === "pending");
  return { accepted, pendingFromA: !!pendingFromA };
}

// Upload file
router.post("/messages/upload", withCurrentUser, upload.single("file"), async (req, res) => {
  if (!req.file) { res.status(400).json({ error: "no_file" }); return; }
  const kind = getFileKind(req.file.filename);
  const url = `/api/uploads/${req.file.filename}`;
  res.json({ url, name: req.file.originalname, kind });
});

// List conversations
router.get("/messages/conversations", withCurrentUser, async (req, res) => {
  const me = req.currentUserId!;

  // Get all users I've exchanged messages with
  const rows = await db.execute(sql`
    SELECT DISTINCT
      CASE WHEN m.sender_id = ${me} THEN m.recipient_id ELSE m.sender_id END AS other_id
    FROM messages m
    WHERE m.sender_id = ${me} OR m.recipient_id = ${me}
  `);

  const otherIds = (rows.rows as { other_id: number }[]).map((r) => Number(r.other_id));
  if (otherIds.length === 0) { res.json([]); return; }

  const conversations = await Promise.all(
    otherIds.map(async (otherId) => {
      const [otherUser] = await db.select({ username: usersTable.username, avatarColor: usersTable.avatarColor }).from(usersTable).where(eq(usersTable.id, otherId)).limit(1);
      if (!otherUser) return null;

      const [lastMsg] = await db
        .select()
        .from(messagesTable)
        .where(
          or(
            and(eq(messagesTable.senderId, me), eq(messagesTable.recipientId, otherId)),
            and(eq(messagesTable.senderId, otherId), eq(messagesTable.recipientId, me)),
          ),
        )
        .orderBy(desc(messagesTable.createdAt))
        .limit(1);

      const [{ count: unread }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(messagesTable)
        .where(and(eq(messagesTable.senderId, otherId), eq(messagesTable.recipientId, me), eq(messagesTable.read, false)));

      const rel = await getFollowRelationship(me, otherId);

      return {
        username: otherUser.username,
        avatarColor: otherUser.avatarColor,
        lastMessage: lastMsg ? (lastMsg.body || `[${lastMsg.kind}]`) : null,
        lastMessageAt: lastMsg?.createdAt.toISOString() ?? null,
        unreadCount: unread,
        isAccepted: rel.accepted,
        lastMessageAt_raw: lastMsg?.createdAt ?? new Date(0),
      };
    }),
  );

  const valid = conversations.filter(Boolean) as NonNullable<(typeof conversations)[number]>[];
  valid.sort((a, b) => b.lastMessageAt_raw.getTime() - a.lastMessageAt_raw.getTime());

  res.json(valid.map(({ lastMessageAt_raw: _, ...rest }) => rest));
});

// Get messages with a user
router.get("/messages/conversations/:username", withCurrentUser, async (req, res) => {
  const me = req.currentUserId!;
  const [other] = await db.select().from(usersTable).where(eq(usersTable.username, String(req.params.username))).limit(1);
  if (!other) { res.status(404).json({ error: "not_found" }); return; }

  // Mark as read
  await db.update(messagesTable).set({ read: true }).where(and(eq(messagesTable.senderId, other.id), eq(messagesTable.recipientId, me), eq(messagesTable.read, false)));

  const msgs = await db
    .select()
    .from(messagesTable)
    .where(
      or(
        and(eq(messagesTable.senderId, me), eq(messagesTable.recipientId, other.id)),
        and(eq(messagesTable.senderId, other.id), eq(messagesTable.recipientId, me)),
      ),
    )
    .orderBy(messagesTable.createdAt)
    .limit(200);

  const rel = await getFollowRelationship(me, other.id);

  // Count how many messages current user has sent while pending
  const [{ count: pendingMsgCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(messagesTable)
    .where(and(eq(messagesTable.senderId, me), eq(messagesTable.recipientId, other.id)));

  res.json({
    messages: msgs.map((m) => ({
      id: m.id,
      senderId: m.senderId,
      body: m.body,
      kind: m.kind,
      fileUrl: m.fileUrl,
      fileName: m.fileName,
      createdAt: m.createdAt.toISOString(),
      isMine: m.senderId === me,
    })),
    isAccepted: rel.accepted,
    pendingMsgCount,
    maxPendingMessages: MAX_PENDING_MESSAGES,
    isFrozen: !rel.accepted && pendingMsgCount >= MAX_PENDING_MESSAGES,
  });
});

// Send a message
router.post("/messages/conversations/:username", withCurrentUser, async (req, res) => {
  const me = req.currentUserId!;
  const [other] = await db.select().from(usersTable).where(eq(usersTable.username, String(req.params.username))).limit(1);
  if (!other) { res.status(404).json({ error: "not_found" }); return; }

  const rel = await getFollowRelationship(me, other.id);

  if (!rel.accepted) {
    // Check if there's a pending follow from me
    if (!rel.pendingFromA) {
      res.status(403).json({ error: "no_follow_relationship", message: "Send a follow request first." });
      return;
    }
    // Count messages sent so far
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(messagesTable)
      .where(and(eq(messagesTable.senderId, me), eq(messagesTable.recipientId, other.id)));
    if (count >= MAX_PENDING_MESSAGES) {
      res.status(403).json({ error: "message_limit_reached", message: "Message limit reached while follow request is pending." });
      return;
    }
  }

  const { body, kind = "text", fileUrl, fileName } = req.body as { body?: string; kind?: string; fileUrl?: string; fileName?: string };
  if (kind === "text" && (!body || !body.trim())) { res.status(400).json({ error: "empty_message" }); return; }
  if (kind !== "text" && !fileUrl) { res.status(400).json({ error: "no_file_url" }); return; }

  const [msg] = await db.insert(messagesTable).values({
    senderId: me,
    recipientId: other.id,
    body: body?.trim() ?? null,
    kind,
    fileUrl: fileUrl ?? null,
    fileName: fileName ?? null,
  }).returning();

  res.json({
    id: msg.id,
    senderId: msg.senderId,
    body: msg.body,
    kind: msg.kind,
    fileUrl: msg.fileUrl,
    fileName: msg.fileName,
    createdAt: msg.createdAt.toISOString(),
    isMine: true,
  });
});

// Accept conversation — recipient accepts sender's pending follow to unlock chat
router.post("/messages/conversations/:username/accept", withCurrentUser, async (req, res) => {
  const me = req.currentUserId!;
  const [other] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.username, String(req.params.username))).limit(1);
  if (!other) { res.status(404).json({ error: "not_found" }); return; }

  const [updated] = await db
    .update(followsTable)
    .set({ status: "accepted" })
    .where(and(eq(followsTable.followerId, other.id), eq(followsTable.followeeId, me)))
    .returning();

  if (!updated) { res.status(404).json({ error: "no_pending_follow" }); return; }
  res.json({ ok: true });
});

export default router;
