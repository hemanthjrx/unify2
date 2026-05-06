import { Router, type IRouter } from "express";
import { db, activityTable, usersTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import { GetActivityFeedResponse } from "@workspace/api-zod";
import { withCurrentUser } from "../lib/auth";

const router: IRouter = Router();

router.get("/feed/activity", withCurrentUser, async (_req, res) => {
  const rows = await db
    .select({
      id: activityTable.id,
      kind: activityTable.kind,
      actorUsername: usersTable.username,
      actorAvatarColor: usersTable.avatarColor,
      message: activityTable.message,
      targetName: activityTable.targetName,
      createdAt: activityTable.createdAt,
    })
    .from(activityTable)
    .innerJoin(usersTable, eq(usersTable.id, activityTable.actorId))
    .orderBy(desc(activityTable.createdAt))
    .limit(30);

  const cleaned = rows
    .filter((r) => r.actorUsername)
    .map((r) => ({
      ...r,
      actorUsername: r.actorUsername!,
    }));

  res.json(GetActivityFeedResponse.parse(cleaned));
});

export default router;
