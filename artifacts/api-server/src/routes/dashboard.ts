import { Router, type IRouter } from "express";
import {
  db,
  usersTable,
  communityMembersTable,
  followsTable,
  userInterestsTable,
  interestsTable,
} from "@workspace/db";
import { desc, eq, sql, notInArray } from "drizzle-orm";
import { GetDashboardSummaryResponse } from "@workspace/api-zod";
import { withCurrentUser } from "../lib/auth";

const PRACTICE_UPLOAD_LIMIT = 5;

const router: IRouter = Router();

router.get("/dashboard/summary", withCurrentUser, async (req, res) => {
  const userId = req.currentUserId!;

  const [me] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!me) {
    res.status(404).json({ error: "not_found" });
    return;
  }

  const [{ count: communityCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(communityMembersTable)
    .where(eq(communityMembersTable.userId, userId));

  const [{ count: followerCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(followsTable)
    .where(eq(followsTable.followeeId, userId));

  const [{ count: followingCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(followsTable)
    .where(eq(followsTable.followerId, userId));

  const topInterestRows = await db
    .select({ name: interestsTable.name })
    .from(userInterestsTable)
    .innerJoin(interestsTable, eq(interestsTable.id, userInterestsTable.interestId))
    .where(eq(userInterestsTable.userId, userId))
    .limit(5);

  const leaderboardRows = await db
    .select({
      id: usersTable.id,
      username: usersTable.username,
      avatarColor: usersTable.avatarColor,
      coins: usersTable.coins,
    })
    .from(usersTable)
    .where(sql`${usersTable.username} is not null and ${usersTable.role} not in ('admin', 'moderator')`)
    .orderBy(desc(usersTable.coins))
    .limit(8);

  const leaderboard = leaderboardRows.map((row, idx) => ({
    username: row.username!,
    avatarColor: row.avatarColor,
    coins: row.coins,
    rank: idx + 1,
    isYou: row.id === userId,
  }));

  const myLeaderboardEntry = leaderboard.find((e) => e.isYou);
  let myRank: number | undefined = myLeaderboardEntry?.rank;
  if (!myRank) {
    const [{ count: usersAhead }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(usersTable)
      .where(sql`${usersTable.coins} > ${me.coins} and ${usersTable.username} is not null and ${usersTable.role} not in ('admin', 'moderator')`);
    myRank = usersAhead + 1;
  }

  const summary = {
    coins: me.coins,
    coinDelta: me.weeklyPoints,
    communityCount,
    followerCount,
    followingCount,
    practiceUploadsRemaining: Math.max(0, PRACTICE_UPLOAD_LIMIT - me.practiceUploadsUsed),
    weeklyPoints: me.weeklyPoints,
    streak: me.streak,
    myRank,
    topInterests: topInterestRows.map((r) => r.name),
    leaderboard,
  };

  res.json(GetDashboardSummaryResponse.parse(summary));
});

export default router;
