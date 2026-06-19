import { db, usersTable, userInterestsTable, interestsTable, communityMembersTable, followsTable } from "@workspace/db";
import { and, eq, sql } from "drizzle-orm";

export async function buildMyProfile(userId: number) {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) throw new Error("user not found");

  const interests = await db
    .select({ id: interestsTable.id, name: interestsTable.name, category: interestsTable.category, emoji: interestsTable.emoji })
    .from(userInterestsTable)
    .innerJoin(interestsTable, eq(interestsTable.id, userInterestsTable.interestId))
    .where(eq(userInterestsTable.userId, userId));

  const [{ count: communityCount }] = await db.select({ count: sql<number>`count(*)::int` }).from(communityMembersTable).where(eq(communityMembersTable.userId, userId));
  const [{ count: followerCount }] = await db.select({ count: sql<number>`count(*)::int` }).from(followsTable).where(and(eq(followsTable.followeeId, userId), eq(followsTable.status, "accepted")));
  const [{ count: followingCount }] = await db.select({ count: sql<number>`count(*)::int` }).from(followsTable).where(and(eq(followsTable.followerId, userId), eq(followsTable.status, "accepted")));

  return {
    id: user.id,
    username: user.username,
    name: user.name,
    email: user.email,
    bio: user.bio,
    role: user.role as "user" | "admin" | "test",
    coins: user.coins,
    avatarColor: user.avatarColor,
    bannerColor: user.bannerColor,
    mobileNumber: user.mobileNumber,
    usn: user.usn,
    semester: user.semester,
    branch: user.branch,
    yearEnrolled: user.yearEnrolled,
    portfolioUrl: user.portfolioUrl,
    linkedinUrl: user.linkedinUrl,
    githubUrl: user.githubUrl,
    isPrivate: user.isPrivate,
    onboardingComplete: user.onboardingComplete,
    interests,
    skills: user.skills,
    communityCount,
    followerCount,
    followingCount,
    usernameChangedAt: user.usernameChangedAt?.toISOString() ?? null,
  };
}

export async function buildUserProfile(viewerId: number, targetUsername: string) {
  const [target] = await db.select().from(usersTable).where(eq(usersTable.username, targetUsername)).limit(1);
  if (!target) return null;

  const [targetInterests, followRow, counts] = await Promise.all([
    db.select({ name: interestsTable.name }).from(userInterestsTable).innerJoin(interestsTable, eq(interestsTable.id, userInterestsTable.interestId)).where(eq(userInterestsTable.userId, target.id)),
    db.select().from(followsTable).where(and(eq(followsTable.followerId, viewerId), eq(followsTable.followeeId, target.id))).limit(1),
    Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(followsTable).where(and(eq(followsTable.followeeId, target.id), eq(followsTable.status, "accepted"))),
      db.select({ count: sql<number>`count(*)::int` }).from(followsTable).where(and(eq(followsTable.followerId, target.id), eq(followsTable.status, "accepted"))),
      db.select({ count: sql<number>`count(*)::int` }).from(communityMembersTable).where(eq(communityMembersTable.userId, target.id)),
    ]),
  ]);
  const [followerResult, followingResult, communityResult] = counts;
  const followStatus = followRow[0] ? (followRow[0].status as "pending" | "accepted") : "none";

  return {
    id: target.id,
    username: target.username!,
    bio: target.bio,
    avatarColor: target.avatarColor,
    coins: target.coins,
    skills: target.skills,
    isPrivate: target.isPrivate,
    portfolioUrl: target.portfolioUrl,
    linkedinUrl: target.linkedinUrl,
    githubUrl: target.githubUrl,
    interests: targetInterests.map((i) => i.name),
    followerCount: followerResult[0]?.count ?? 0,
    followingCount: followingResult[0]?.count ?? 0,
    communityCount: communityResult[0]?.count ?? 0,
    isFollowing: followStatus === "accepted",
    followStatus,
  };
}

export async function buildPublicProfile(viewerId: number, targetUsername: string) {
  const [target] = await db.select().from(usersTable).where(eq(usersTable.username, targetUsername)).limit(1);
  if (!target) return null;

  const [viewerInterests, targetInterests] = await Promise.all([
    db.select({ name: interestsTable.name }).from(userInterestsTable).innerJoin(interestsTable, eq(interestsTable.id, userInterestsTable.interestId)).where(eq(userInterestsTable.userId, viewerId)),
    db.select({ name: interestsTable.name }).from(userInterestsTable).innerJoin(interestsTable, eq(interestsTable.id, userInterestsTable.interestId)).where(eq(userInterestsTable.userId, target.id)),
  ]);

  const viewerNames = new Set(viewerInterests.map((i) => i.name));
  const shared = targetInterests.filter((i) => viewerNames.has(i.name)).map((i) => i.name);

  const [follow] = await db.select().from(followsTable).where(and(eq(followsTable.followerId, viewerId), eq(followsTable.followeeId, target.id))).limit(1);
  const followStatus = follow ? (follow.status as "pending" | "accepted") : "none";

  return {
    id: target.id,
    username: target.username!,
    bio: target.bio,
    avatarColor: target.avatarColor,
    coins: target.coins,
    sharedInterests: shared,
    skills: target.skills,
    isPrivate: target.isPrivate,
    isFollowing: followStatus === "accepted",
    followStatus,
  };
}
