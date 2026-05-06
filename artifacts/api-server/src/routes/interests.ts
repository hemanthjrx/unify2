import { Router, type IRouter } from "express";
import { db, interestsTable } from "@workspace/db";
import { ListInterestsResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/interests", async (_req, res) => {
  const rows = await db
    .select({
      id: interestsTable.id,
      name: interestsTable.name,
      category: interestsTable.category,
      emoji: interestsTable.emoji,
    })
    .from(interestsTable)
    .orderBy(interestsTable.category, interestsTable.name);
  res.json(ListInterestsResponse.parse(rows));
});

export default router;
