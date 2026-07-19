import { Router, type IRouter } from "express";
import {
  db,
  usersTable,
  communitiesTable,
  communityMembersTable,
  activityTable,
  marketplaceProductsTable,
  freelanceServicesTable,
  reportsTable,
  warningStrikesTable,
  categoriesTable,
  interestsTable,
} from "@workspace/db";
import { desc, eq, ilike, or, sql, and } from "drizzle-orm";
import { withAdminUser, withModeratorOrAdmin } from "../lib/auth";
import { z } from "zod";
import bcrypt from "bcrypt";

const BAN_DURATIONS: Record<string, number | null> = {
  "3d": 3 * 24 * 60 * 60 * 1000,
  "1w": 7 * 24 * 60 * 60 * 1000,
  "1m": 30 * 24 * 60 * 60 * 1000,
  "3m": 90 * 24 * 60 * 60 * 1000,
  "permanent": null,
  "manual": null,
};

const router: IRouter = Router();

router.get("/admin/users", withAdminUser, async (req, res) => {
  const search = String(req.query.search ?? "").trim();
  let query = db
    .select({
      id: usersTable.id,
      username: usersTable.username,
      name: usersTable.name,
      email: usersTable.email,
      mobileNumber: usersTable.mobileNumber,
      usn: usersTable.usn,
      role: usersTable.role,
      isBanned: usersTable.isBanned,
      avatarColor: usersTable.avatarColor,
      coins: usersTable.coins,
      onboardingComplete: usersTable.onboardingComplete,
      accountStatus: usersTable.accountStatus,
      createdAt: usersTable.createdAt,
    })
    .from(usersTable)
    .orderBy(desc(usersTable.createdAt))
    .$dynamic();

  if (search) {
    query = query.where(
      or(
        ilike(usersTable.username, `%${search}%`),
        ilike(usersTable.email, `%${search}%`),
        ilike(usersTable.usn, `%${search}%`),
      )
    );
  }

  const users = await query;
  res.json(users);
});

router.get("/admin/users/search", withModeratorOrAdmin, async (req, res) => {
  const q = String(req.query.q || "").trim();
  if (!q) { res.json([]); return; }
  const rows = await db
    .select({ id: usersTable.id, username: usersTable.username, usn: usersTable.usn, avatarColor: usersTable.avatarColor, name: usersTable.name })
    .from(usersTable)
    .where(and(
      eq(usersTable.role, "student"),
      or(ilike(usersTable.username, `%${q}%`), ilike(usersTable.usn, `%${q}%`), ilike(usersTable.name, `%${q}%`)),
    ))
    .limit(10);
  res.json(rows);
});

router.get("/admin/users/:userId", withAdminUser, async (req, res) => {
  const userId = Number(req.params.userId);
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);
  if (!user) {
    res.status(404).json({ error: "not_found" });
    return;
  }

  const activities = await db
    .select()
    .from(activityTable)
    .where(eq(activityTable.actorId, userId))
    .orderBy(desc(activityTable.createdAt))
    .limit(50);

  const communityCount = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(communityMembersTable)
    .where(eq(communityMembersTable.userId, userId));

  res.json({
    id: user.id,
    username: user.username,
    email: user.email,
    mobileNumber: user.mobileNumber,
    usn: user.usn,
    role: user.role,
    isBanned: user.isBanned,
    avatarColor: user.avatarColor,
    bannerColor: user.bannerColor,
    coins: user.coins,
    bio: user.bio,
    skills: user.skills,
    onboardingComplete: user.onboardingComplete,
    weeklyPoints: user.weeklyPoints,
    communityCount: communityCount[0]?.count ?? 0,
    createdAt: user.createdAt,
    activities: activities.map((a) => ({
      id: a.id,
      kind: a.kind,
      message: a.message,
      targetName: a.targetName,
      createdAt: a.createdAt,
    })),
  });
});

router.patch("/admin/users/:userId", withAdminUser, async (req, res) => {
  const userId = Number(req.params.userId);
  const body = z.object({
    isBanned: z.boolean().optional(),
    banDuration: z.string().optional(),
    role: z.string().optional(),
  }).parse(req.body);

  let bannedUntil: Date | null | undefined;
  if (body.isBanned === true && body.banDuration) {
    const ms = BAN_DURATIONS[body.banDuration];
    bannedUntil = ms != null ? new Date(Date.now() + ms) : null;
  } else if (body.isBanned === false) {
    bannedUntil = null;
  }

  const [updated] = await db
    .update(usersTable)
    .set({
      ...(body.isBanned !== undefined ? { isBanned: body.isBanned } : {}),
      ...(bannedUntil !== undefined ? { bannedUntil } : {}),
      ...(body.role !== undefined ? { role: body.role } : {}),
    })
    .where(eq(usersTable.id, userId))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "not_found" });
    return;
  }
  res.json({ id: updated.id, isBanned: updated.isBanned, bannedUntil: updated.bannedUntil, role: updated.role });
});

// Applications (moderator + admin)
router.get("/admin/applications", withModeratorOrAdmin, async (req, res) => {
  const search = String(req.query.search ?? "").trim();
  const status = String(req.query.status ?? "");

  const reviewerAlias = db
    .select({ id: usersTable.id, username: usersTable.username, role: usersTable.role })
    .from(usersTable)
    .as("reviewer");

  let rows = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      username: usersTable.username,
      usn: usersTable.usn,
      email: usersTable.email,
      mobileNumber: usersTable.mobileNumber,
      branch: usersTable.branch,
      semester: usersTable.semester,
      avatarColor: usersTable.avatarColor,
      accountStatus: usersTable.accountStatus,
      idCardUrl: usersTable.idCardUrl,
      feeReceiptUrl: usersTable.feeReceiptUrl,
      reviewedAt: usersTable.reviewedAt,
      rejectionReason: usersTable.rejectionReason,
      createdAt: usersTable.createdAt,
      reviewerUsername: reviewerAlias.username,
      reviewerRole: reviewerAlias.role,
    })
    .from(usersTable)
    .leftJoin(reviewerAlias, eq(reviewerAlias.id, usersTable.reviewedBy))
    .where(
      sql`${usersTable.accountStatus} IN ('pending','approved','rejected')
          AND ${usersTable.idCardUrl} IS NOT NULL`
    )
    .orderBy(desc(usersTable.createdAt));

  if (status && ["pending", "approved", "rejected"].includes(status)) {
    rows = rows.filter((r) => r.accountStatus === status);
  }
  if (search) {
    const s = search.toLowerCase();
    rows = rows.filter(
      (r) =>
        r.name?.toLowerCase().includes(s) ||
        r.usn?.toLowerCase().includes(s) ||
        r.email?.toLowerCase().includes(s),
    );
  }

  res.json(rows);
});

router.post("/admin/applications/:userId/approve", withModeratorOrAdmin, async (req, res) => {
  const userId = Number(req.params.userId);
  const reviewerId = req.currentUserId!;

  const [updated] = await db
    .update(usersTable)
    .set({
      accountStatus: "approved",
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
      rejectionReason: null,
    })
    .where(eq(usersTable.id, userId))
    .returning({ id: usersTable.id, accountStatus: usersTable.accountStatus });

  if (!updated) {
    res.status(404).json({ error: "not_found" });
    return;
  }
  res.json(updated);
});

router.post("/admin/applications/:userId/reject", withModeratorOrAdmin, async (req, res) => {
  const userId = Number(req.params.userId);
  const reviewerId = req.currentUserId!;
  const body = z.object({ reason: z.string().min(1).max(500) }).parse(req.body);

  const [updated] = await db
    .update(usersTable)
    .set({
      accountStatus: "rejected",
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
      rejectionReason: body.reason,
    })
    .where(eq(usersTable.id, userId))
    .returning({ id: usersTable.id, accountStatus: usersTable.accountStatus });

  if (!updated) {
    res.status(404).json({ error: "not_found" });
    return;
  }
  res.json(updated);
});

// Content reports
router.post("/admin/reports", async (req, res) => {
  const authHeader = req.headers.authorization;
  let reporterId: number | null = null;
  if (authHeader?.startsWith("Bearer ")) {
    try {
      const jwt = await import("jsonwebtoken");
      const { JWT_SECRET } = await import("../lib/auth");
      const payload = jwt.default.verify(authHeader.slice(7), JWT_SECRET) as { userId: number };
      reporterId = payload.userId;
    } catch { /* unauthenticated */ }
  }

  const body = z.object({
    targetType: z.enum(["post", "marketplace", "freelance", "hackathon"]),
    targetId: z.number().int(),
    description: z.string().min(5).max(1000),
  }).parse(req.body);

  await db.insert(reportsTable).values({
    reporterId,
    targetType: body.targetType,
    targetId: body.targetId,
    description: body.description,
    status: "pending",
  });
  res.status(201).json({ ok: true });
});

router.get("/admin/reports", withModeratorOrAdmin, async (req, res) => {
  const search = String(req.query.search ?? "").trim();

  const reporterAlias = db
    .select({ id: usersTable.id, username: usersTable.username })
    .from(usersTable)
    .as("reporter_user");

  const reportedAlias = db
    .select({ id: usersTable.id, username: usersTable.username, usn: usersTable.usn })
    .from(usersTable)
    .as("reported_user");

  const rows = await db
    .select({
      id: reportsTable.id,
      targetType: reportsTable.targetType,
      targetId: reportsTable.targetId,
      targetUsn: reportsTable.targetUsn,
      description: reportsTable.description,
      status: reportsTable.status,
      reviewNote: reportsTable.reviewNote,
      reviewedAt: reportsTable.reviewedAt,
      createdAt: reportsTable.createdAt,
      reporterUsername: reporterAlias.username,
      reportedUserId: reportedAlias.id,
      reportedUsername: reportedAlias.username,
    })
    .from(reportsTable)
    .leftJoin(reporterAlias, eq(reporterAlias.id, reportsTable.reporterId))
    .leftJoin(reportedAlias, eq(reportedAlias.usn, reportsTable.targetUsn))
    .orderBy(desc(reportsTable.createdAt));

  const filtered = search
    ? rows.filter(
        (r) =>
          r.targetType.includes(search.toLowerCase()) ||
          r.description.toLowerCase().includes(search.toLowerCase()) ||
          r.reporterUsername?.toLowerCase().includes(search.toLowerCase()),
      )
    : rows;

  res.json(filtered);
});

router.patch("/admin/reports/:reportId", withModeratorOrAdmin, async (req, res) => {
  const reportId = Number(req.params.reportId);
  const body = z.object({
    status: z.enum(["pending", "reviewed", "dismissed"]),
    reviewNote: z.string().max(500).optional(),
  }).parse(req.body);

  const [updated] = await db
    .update(reportsTable)
    .set({
      status: body.status,
      reviewNote: body.reviewNote ?? null,
      reviewedBy: req.currentUserId!,
      reviewedAt: new Date(),
    })
    .where(eq(reportsTable.id, reportId))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "not_found" });
    return;
  }
  res.json(updated);
});

router.get("/admin/moderators", withAdminUser, async (_req, res) => {
  const mods = await db
    .select({
      id: usersTable.id,
      username: usersTable.username,
      email: usersTable.email,
      name: usersTable.name,
      createdAt: usersTable.createdAt,
      isBanned: usersTable.isBanned,
    })
    .from(usersTable)
    .where(eq(usersTable.role, "moderator"))
    .orderBy(desc(usersTable.createdAt));
  res.json(mods);
});

router.post("/admin/moderators", withAdminUser, async (req, res) => {
  const body = z.object({
    username: z.string().min(3).max(30).regex(/^[A-Z0-9_]+$/),
    password: z.string().min(6).max(100),
    name: z.string().min(1).max(80).optional(),
    email: z.string().email().optional(),
  }).parse(req.body);

  const [existing] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.username, body.username))
    .limit(1);
  if (existing) {
    res.status(409).json({ error: "username_taken" });
    return;
  }

  const passwordHash = await bcrypt.hash(body.password, 12);
  const [created] = await db
    .insert(usersTable)
    .values({
      username: body.username,
      name: body.name ?? body.username,
      email: body.email ?? null,
      passwordHash,
      role: "moderator",
      accountStatus: "approved",
      onboardingComplete: true,
    })
    .returning({
      id: usersTable.id,
      username: usersTable.username,
      name: usersTable.name,
      email: usersTable.email,
      createdAt: usersTable.createdAt,
    });
  res.status(201).json(created);
});

router.delete("/admin/moderators/:id", withAdminUser, async (req, res) => {
  const id = Number(req.params.id);
  const [mod] = await db
    .select({ id: usersTable.id, role: usersTable.role })
    .from(usersTable)
    .where(eq(usersTable.id, id))
    .limit(1);
  if (!mod || mod.role !== "moderator") {
    res.status(404).json({ error: "not_found" });
    return;
  }
  await db.delete(usersTable).where(eq(usersTable.id, id));
  res.status(204).send();
});

router.post("/admin/communities", withAdminUser, async (req, res) => {
  const body = z.object({
    name: z.string().min(1).max(80),
    slug: z.string().min(1).max(80).regex(/^[a-z0-9-]+$/),
    description: z.string().min(1).max(500),
    accentColor: z.string().default("#7c5cff"),
    tags: z.array(z.string()).default([]),
    bannerImageUrl: z.string().url().optional().nullable(),
    profileImageUrl: z.string().url().optional().nullable(),
    leaderId: z.number().int().positive().optional().nullable(),
  }).parse(req.body);

  const [created] = await db
    .insert(communitiesTable)
    .values({ ...body, icon: "💬" })
    .returning();
  res.status(201).json(created);
});

router.get("/admin/communities/:id/members", withAdminUser, async (req, res) => {
  const id = Number(req.params.id);
  const members = await db
    .select({
      id: usersTable.id,
      username: usersTable.username,
      avatarColor: usersTable.avatarColor,
      joinedAt: communityMembersTable.joinedAt,
    })
    .from(communityMembersTable)
    .innerJoin(usersTable, eq(usersTable.id, communityMembersTable.userId))
    .where(eq(communityMembersTable.communityId, id))
    .orderBy(desc(communityMembersTable.joinedAt));
  res.json(members.map((m) => ({ id: m.id, username: m.username ?? "—", avatarColor: m.avatarColor, joinedAt: m.joinedAt.toISOString() })));
});

router.delete("/admin/communities/:id/members/:userId", withAdminUser, async (req, res) => {
  const id = Number(req.params.id);
  const userId = Number(req.params.userId);
  await db.delete(communityMembersTable).where(
    sql`${communityMembersTable.communityId} = ${id} AND ${communityMembersTable.userId} = ${userId}`
  );
  res.status(204).send();
});

router.patch("/admin/communities/:id", withAdminUser, async (req, res) => {
  const id = Number(req.params.id);
  const body = z.object({
    name: z.string().min(1).max(80).optional(),
    description: z.string().min(1).max(500).optional(),
    accentColor: z.string().optional(),
    tags: z.array(z.string()).optional(),
    bannerImageUrl: z.string().url().optional().nullable(),
    profileImageUrl: z.string().url().optional().nullable(),
    leaderId: z.number().int().positive().optional().nullable(),
  }).parse(req.body);

  const [updated] = await db
    .update(communitiesTable)
    .set(body)
    .where(eq(communitiesTable.id, id))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "not_found" });
    return;
  }
  res.json(updated);
});

router.delete("/admin/communities/:id", withAdminUser, async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(communitiesTable).where(eq(communitiesTable.id, id));
  res.status(204).send();
});

router.get("/admin/marketplace", withAdminUser, async (_req, res) => {
  const rows = await db
    .select({
      id: marketplaceProductsTable.id,
      title: marketplaceProductsTable.title,
      description: marketplaceProductsTable.description,
      price: marketplaceProductsTable.price,
      category: marketplaceProductsTable.category,
      images: marketplaceProductsTable.images,
      contactInfo: marketplaceProductsTable.contactInfo,
      createdAt: marketplaceProductsTable.createdAt,
      sellerId: marketplaceProductsTable.sellerId,
      sellerUsername: usersTable.username,
    })
    .from(marketplaceProductsTable)
    .innerJoin(usersTable, eq(usersTable.id, marketplaceProductsTable.sellerId))
    .orderBy(desc(marketplaceProductsTable.createdAt));
  res.json(rows);
});

router.patch("/admin/marketplace/:id", withAdminUser, async (req, res) => {
  const id = Number(req.params.id);
  const body = z.object({
    title: z.string().min(1).max(120).optional(),
    description: z.string().min(1).max(2000).optional(),
    price: z.number().min(0).optional(),
    category: z.string().max(60).optional(),
    contactInfo: z.string().max(200).optional(),
  }).parse(req.body);

  const [updated] = await db
    .update(marketplaceProductsTable)
    .set({ ...body, price: body.price !== undefined ? String(body.price) : undefined })
    .where(eq(marketplaceProductsTable.id, id))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "not_found" });
    return;
  }
  res.json(updated);
});

router.delete("/admin/marketplace/:id", withAdminUser, async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(marketplaceProductsTable).where(eq(marketplaceProductsTable.id, id));
  res.status(204).send();
});

router.get("/admin/freelance", withAdminUser, async (_req, res) => {
  const rows = await db
    .select({
      id: freelanceServicesTable.id,
      title: freelanceServicesTable.title,
      category: freelanceServicesTable.category,
      price: freelanceServicesTable.price,
      createdAt: freelanceServicesTable.createdAt,
      providerId: freelanceServicesTable.providerId,
      providerUsername: usersTable.username,
    })
    .from(freelanceServicesTable)
    .innerJoin(usersTable, eq(usersTable.id, freelanceServicesTable.providerId))
    .orderBy(desc(freelanceServicesTable.createdAt));
  res.json(rows);
});

router.delete("/admin/freelance/:id", withAdminUser, async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(freelanceServicesTable).where(eq(freelanceServicesTable.id, id));
  res.status(204).send();
});

router.get("/admin/users/:userId/warnings", withModeratorOrAdmin, async (req, res) => {
  const userId = Number(req.params.userId);
  const issuerAlias = db.select({ id: usersTable.id, username: usersTable.username }).from(usersTable).as("issuer");
  const rows = await db
    .select({
      id: warningStrikesTable.id,
      description: warningStrikesTable.description,
      screenshotUrl: warningStrikesTable.screenshotUrl,
      createdAt: warningStrikesTable.createdAt,
      issuedByUsername: issuerAlias.username,
    })
    .from(warningStrikesTable)
    .leftJoin(issuerAlias, eq(issuerAlias.id, warningStrikesTable.issuedById))
    .where(eq(warningStrikesTable.userId, userId))
    .orderBy(desc(warningStrikesTable.createdAt));
  res.json(rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })));
});

router.post("/admin/users/:userId/warnings", withModeratorOrAdmin, async (req, res) => {
  const userId = Number(req.params.userId);
  const issuedById = req.currentUserId!;
  const body = z.object({
    description: z.string().min(3).max(1000),
    screenshotUrl: z.string().url().optional().nullable(),
  }).parse(req.body);

  const [user] = await db.select({ id: usersTable.id, isBanned: usersTable.isBanned }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) { res.status(404).json({ error: "not_found" }); return; }
  if (user.isBanned) { res.status(409).json({ error: "already_banned" }); return; }

  await db.insert(warningStrikesTable).values({ userId, issuedById, description: body.description, screenshotUrl: body.screenshotUrl ?? null });

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(warningStrikesTable)
    .where(eq(warningStrikesTable.userId, userId));

  let autoBanned = false;
  if (Number(count) >= 5) {
    await db.update(usersTable).set({ isBanned: true }).where(eq(usersTable.id, userId));
    autoBanned = true;
  }

  await db.insert(activityTable).values({ actorId: issuedById, kind: "warning_issued", message: `Issued warning strike #${count} to user #${userId}` });

  res.json({ ok: true, totalWarnings: Number(count), autoBanned });
});

router.get("/admin/categories", withAdminUser, async (req, res) => {
  const type = req.query.type as string | undefined;
  const rows = await db
    .select()
    .from(categoriesTable)
    .where(type ? eq(categoriesTable.type, type) : undefined)
    .orderBy(categoriesTable.type, categoriesTable.name);
  res.json(rows);
});

router.post("/admin/categories", withAdminUser, async (req, res) => {
  const body = z.object({
    type: z.enum(["marketplace", "freelance"]),
    name: z.string().min(1).max(60),
  }).parse(req.body);
  const [row] = await db.insert(categoriesTable).values(body).returning();
  res.status(201).json(row);
});

router.delete("/admin/categories/:id", withAdminUser, async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(categoriesTable).where(eq(categoriesTable.id, id));
  res.status(204).send();
});

router.get("/admin/interests", withAdminUser, async (_req, res) => {
  const rows = await db.select().from(interestsTable).orderBy(interestsTable.category, interestsTable.name);
  res.json(rows);
});

router.post("/admin/interests", withAdminUser, async (req, res) => {
  const body = z.object({
    name: z.string().min(1).max(80),
    category: z.string().min(1).max(60),
    emoji: z.string().max(10).optional().nullable(),
  }).parse(req.body);
  const [row] = await db.insert(interestsTable).values(body).returning();
  res.status(201).json(row);
});

router.patch("/admin/interests/:id", withAdminUser, async (req, res) => {
  const id = Number(req.params.id);
  const body = z.object({
    name: z.string().min(1).max(80).optional(),
    category: z.string().min(1).max(60).optional(),
    emoji: z.string().max(10).optional().nullable(),
  }).parse(req.body);
  const [row] = await db.update(interestsTable).set(body).where(eq(interestsTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "not_found" }); return; }
  res.json(row);
});

router.delete("/admin/interests/:id", withAdminUser, async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(interestsTable).where(eq(interestsTable.id, id));
  res.status(204).send();
});

export default router;
