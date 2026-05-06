import { Router, type IRouter } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db, usersTable, reportsTable } from "@workspace/db";
import { eq, or } from "drizzle-orm";
import { JWT_SECRET } from "../lib/auth";

const ACCENT_COLORS = [
  "#7c5cff", "#22d3ee", "#f472b6", "#34d399",
  "#fb923c", "#facc15", "#a78bfa", "#f87171",
];

const VALID_SEMESTERS = ["1", "2", "3", "4", "5", "6", "7", "8"];
const VALID_BRANCHES = ["AD", "AI", "CE", "AM", "IC", "CS", "EE", "CI", "EC", "IS", "ME"];

const router: IRouter = Router();

router.get("/auth/check-usn", async (req, res) => {
  const usn = String(req.query.usn ?? "").trim().toUpperCase();
  if (!usn) {
    res.status(400).json({ error: "missing_usn" });
    return;
  }
  const [user] = await db
    .select({ id: usersTable.id, username: usersTable.username, name: usersTable.name })
    .from(usersTable)
    .where(eq(usersTable.usn, usn))
    .limit(1);
  if (user) {
    res.json({ exists: true, username: user.username, name: user.name });
  } else {
    res.json({ exists: false });
  }
});

router.post("/auth/usn-conflict-report", async (req, res) => {
  const { claimedUsn, description, reporterName, reporterEmail } = req.body as Record<string, string>;
  if (!claimedUsn?.trim() || !description?.trim()) {
    res.status(400).json({ error: "missing_fields" });
    return;
  }
  const fullDesc = `Reporter: ${reporterName ?? "unknown"} (${reporterEmail ?? "no email"})\n\n${description}`;
  await db.insert(reportsTable).values({
    reporterId: null,
    targetType: "usn_conflict",
    targetUsn: claimedUsn.trim().toUpperCase(),
    description: fullDesc,
    status: "pending",
  });
  res.json({ ok: true });
});

router.post("/auth/register", async (req, res) => {
  const { name, usn, email, mobileNumber, password, semester, branch, dob, idCardUrl, feeReceiptUrl } =
    req.body as Record<string, string>;

  if (
    !name?.trim() ||
    !usn?.trim() ||
    !email?.trim() ||
    !mobileNumber?.trim() ||
    !password ||
    !semester ||
    !branch ||
    !dob
  ) {
    res.status(400).json({ error: "all_fields_required", message: "All fields are required." });
    return;
  }

  if (!idCardUrl?.trim()) {
    res.status(400).json({ error: "id_card_required", message: "Please upload your college ID card." });
    return;
  }

  if (!feeReceiptUrl?.trim()) {
    res.status(400).json({ error: "fee_receipt_required", message: "Please upload your fee receipt." });
    return;
  }

  if (!VALID_SEMESTERS.includes(semester)) {
    res.status(400).json({ error: "invalid_semester", message: "Invalid semester." });
    return;
  }

  if (!VALID_BRANCHES.includes(branch)) {
    res.status(400).json({ error: "invalid_branch", message: "Invalid branch." });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({ error: "password_too_short", message: "Password must be at least 8 characters." });
    return;
  }

  const usnUpper = usn.trim().toUpperCase();
  const emailLower = email.trim().toLowerCase();

  const existing = await db
    .select({ id: usersTable.id, usn: usersTable.usn, email: usersTable.email, username: usersTable.username })
    .from(usersTable)
    .where(or(eq(usersTable.usn, usnUpper), eq(usersTable.email, emailLower)))
    .limit(1);

  if (existing.length > 0) {
    if (existing[0].usn === usnUpper) {
      res.status(409).json({
        error: "usn_taken",
        message: "This USN is already registered.",
        username: existing[0].username,
      });
    } else {
      res.status(409).json({ error: "email_taken", message: "This email is already registered." });
    }
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const avatarColor = ACCENT_COLORS[Math.floor(Math.random() * ACCENT_COLORS.length)];

  await db
    .insert(usersTable)
    .values({
      name: name.trim(),
      usn: usnUpper,
      email: emailLower,
      mobileNumber: mobileNumber.trim(),
      semester,
      branch,
      dob,
      passwordHash,
      avatarColor,
      onboardingComplete: false,
      accountStatus: "pending",
      idCardUrl: idCardUrl.trim(),
      feeReceiptUrl: feeReceiptUrl.trim(),
    });

  res.status(201).json({ ok: true, message: "Application submitted. Your account is pending review by a moderator." });
});

router.post("/auth/login", async (req, res) => {
  const { usn, password } = req.body as { usn: string; password: string };

  if (!usn?.trim() || !password) {
    res.status(400).json({ error: "missing_credentials", message: "USN and password are required." });
    return;
  }

  const usnUpper = usn.trim().toUpperCase();

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.usn, usnUpper))
    .limit(1);

  if (!user || !user.passwordHash) {
    res.status(401).json({ error: "invalid_credentials", message: "Invalid USN or password." });
    return;
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    res.status(401).json({ error: "invalid_credentials", message: "Invalid USN or password." });
    return;
  }

  if (user.isBanned) {
    res.status(403).json({ error: "banned", message: "Your account has been suspended." });
    return;
  }

  if (user.accountStatus === "pending") {
    res.status(403).json({
      error: "account_pending",
      message: "Your account is pending review. You will be notified once it is approved.",
    });
    return;
  }

  if (user.accountStatus === "rejected") {
    res.status(403).json({
      error: "account_rejected",
      message: `Your account application was rejected. Reason: ${user.rejectionReason ?? "No reason provided."}`,
    });
    return;
  }

  const now = new Date();
  const ms48h = 48 * 60 * 60 * 1000;
  const shouldIncrement =
    !user.lastLoginAt || now.getTime() - user.lastLoginAt.getTime() >= ms48h;

  if (shouldIncrement) {
    await db
      .update(usersTable)
      .set({ streak: user.streak + 1, lastLoginAt: now })
      .where(eq(usersTable.id, user.id));
  }

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "30d" });
  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, usn: user.usn },
  });
});

export default router;
