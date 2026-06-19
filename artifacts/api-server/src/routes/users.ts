import { Router, type IRouter } from "express";
import { db, usersTable, userInterestsTable, activityTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import {
  GetMyProfileResponse,
  UpdateMyProfileBody,
  UpdateMyProfileResponse,
  CompleteOnboardingBody,
  CompleteOnboardingResponse,
} from "@workspace/api-zod";
import { withCurrentUser } from "../lib/auth";
import { buildMyProfile, buildUserProfile } from "../lib/profile";

const router: IRouter = Router();

router.get("/users/:username", withCurrentUser, async (req, res) => {
  const username = String(req.params.username);
  const profile = await buildUserProfile(req.currentUserId!, username);
  if (!profile) {
    res.status(404).json({ error: "not_found" });
    return;
  }
  res.json(profile);
});

router.get("/me", withCurrentUser, async (req, res) => {
  const profile = await buildMyProfile(req.currentUserId!);
  res.json(GetMyProfileResponse.parse(profile));
});

router.patch("/me", withCurrentUser, async (req, res) => {
  const body = UpdateMyProfileBody.parse(req.body);

  // Enforce 100-day cooldown on username changes
  if (body.username !== undefined) {
    const [current] = await db.select().from(usersTable).where(eq(usersTable.id, req.currentUserId!)).limit(1);
    if (current?.username !== body.username) {
      // Check uniqueness
      const [taken] = await db.select().from(usersTable).where(eq(usersTable.username, body.username)).limit(1);
      if (taken && taken.id !== req.currentUserId) {
        res.status(409).json({ error: "username_taken", message: "This username is already taken." });
        return;
      }
      // Check cooldown
      if (current?.usernameChangedAt) {
        const daysSince = (Date.now() - new Date(current.usernameChangedAt).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSince < 100) {
          const daysLeft = Math.ceil(100 - daysSince);
          res.status(429).json({ error: "username_cooldown", daysLeft, message: `You can change your username again in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}.` });
          return;
        }
      }
    }
  }

  await db
    .update(usersTable)
    .set({
      ...(body.username !== undefined ? { username: body.username, usernameChangedAt: new Date() } : {}),
      ...(body.bio !== undefined ? { bio: body.bio } : {}),
      ...(body.skills !== undefined ? { skills: body.skills } : {}),
      ...(body.avatarColor !== undefined ? { avatarColor: body.avatarColor } : {}),
      ...(body.bannerColor !== undefined ? { bannerColor: body.bannerColor } : {}),
      ...(body.mobileNumber !== undefined ? { mobileNumber: body.mobileNumber } : {}),
      ...(body.usn !== undefined ? { usn: body.usn } : {}),
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.semester !== undefined ? { semester: body.semester } : {}),
      ...(body.branch !== undefined ? { branch: body.branch } : {}),
      ...(body.yearEnrolled !== undefined ? { yearEnrolled: body.yearEnrolled } : {}),
      ...(body.portfolioUrl !== undefined ? { portfolioUrl: body.portfolioUrl } : {}),
      ...(body.linkedinUrl !== undefined ? { linkedinUrl: body.linkedinUrl } : {}),
      ...(body.githubUrl !== undefined ? { githubUrl: body.githubUrl } : {}),
    })
    .where(eq(usersTable.id, req.currentUserId!));

  if (body.interestIds) {
    await db.delete(userInterestsTable).where(eq(userInterestsTable.userId, req.currentUserId!));
    if (body.interestIds.length > 0) {
      await db.insert(userInterestsTable).values(
        body.interestIds.map((interestId) => ({
          userId: req.currentUserId!,
          interestId,
        })),
      );
    }
  }

  const profile = await buildMyProfile(req.currentUserId!);
  res.json(UpdateMyProfileResponse.parse(profile));
});

router.post("/me/onboarding", withCurrentUser, async (req, res) => {
  const body = CompleteOnboardingBody.parse(req.body);

  const existing = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, body.username))
    .limit(1);
  if (existing.length > 0 && existing[0].id !== req.currentUserId) {
    res.status(409).json({ error: "username_taken" });
    return;
  }

  await db
    .update(usersTable)
    .set({
      username: body.username,
      bio: body.bio ?? null,
      skills: body.skills ?? [],
      onboardingComplete: true,
    })
    .where(eq(usersTable.id, req.currentUserId!));

  await db.delete(userInterestsTable).where(eq(userInterestsTable.userId, req.currentUserId!));
  if (body.interestIds.length > 0) {
    await db.insert(userInterestsTable).values(
      body.interestIds.map((interestId) => ({
        userId: req.currentUserId!,
        interestId,
      })),
    );
  }

  const profile = await buildMyProfile(req.currentUserId!);
  res.json(CompleteOnboardingResponse.parse(profile));
});

// Get my own activity (coin history)
const COIN_DELTAS: Record<string, number> = {
  post: 2,
  community_join: 10,
  community_leave: -10,
  hackathon: 5,
  resource: 5,
  follow: 0,
  community_post: 0,
  badge: 0,
};

router.get("/me/activity", withCurrentUser, async (req, res) => {
  const rows = await db
    .select()
    .from(activityTable)
    .where(eq(activityTable.actorId, req.currentUserId!))
    .orderBy(desc(activityTable.createdAt))
    .limit(50);

  res.json(rows.map((r) => ({
    id: r.id,
    kind: r.kind,
    message: r.message,
    coinsDelta: COIN_DELTAS[r.kind] ?? 0,
    createdAt: r.createdAt.toISOString(),
  })));
});

export default router;
