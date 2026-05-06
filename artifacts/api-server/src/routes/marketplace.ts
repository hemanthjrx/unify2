import { Router, type IRouter } from "express";
import {
  db,
  marketplaceProductsTable,
  productReviewsTable,
  usersTable,
} from "@workspace/db";
import { and, desc, eq, sql } from "drizzle-orm";
import { withCurrentUser } from "../lib/auth";
import { z } from "zod";

const router: IRouter = Router();

const imagePath = z
  .string()
  .refine((value) => value.startsWith("/"), "Must be a storage path or URL");

const CreateProductBody = z.object({
  title: z.string().min(1).max(120),
  description: z.string().min(1).max(2000),
  price: z.number().min(0),
  images: z.array(z.union([z.string().url(), imagePath])).max(5).default([]),
  category: z.string().min(1).max(60).default("other"),
  contactInfo: z.string().max(200).optional(),
});

const CreateReviewBody = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});

async function buildProduct(id: number, viewerId: number) {
  const [row] = await db
    .select({
      id: marketplaceProductsTable.id,
      title: marketplaceProductsTable.title,
      description: marketplaceProductsTable.description,
      price: marketplaceProductsTable.price,
      images: marketplaceProductsTable.images,
      category: marketplaceProductsTable.category,
      contactInfo: marketplaceProductsTable.contactInfo,
      createdAt: marketplaceProductsTable.createdAt,
      sellerId: marketplaceProductsTable.sellerId,
      sellerUsername: usersTable.username,
      sellerAvatarColor: usersTable.avatarColor,
      avgRating: sql<number>`coalesce(
        (select avg(rating)::numeric(3,1) from ${productReviewsTable}
         where ${productReviewsTable.productId} = ${marketplaceProductsTable.id}), 0
      )`.as("avg_rating"),
      reviewCount: sql<number>`(
        select count(*)::int from ${productReviewsTable}
        where ${productReviewsTable.productId} = ${marketplaceProductsTable.id}
      )`.as("review_count"),
    })
    .from(marketplaceProductsTable)
    .innerJoin(usersTable, eq(usersTable.id, marketplaceProductsTable.sellerId))
    .where(eq(marketplaceProductsTable.id, id));

  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    price: row.price,
    images: row.images,
    category: row.category,
    contactInfo: row.contactInfo,
    createdAt: row.createdAt.toISOString(),
    seller: {
      id: row.sellerId,
      username: row.sellerUsername ?? "unknown",
      avatarColor: row.sellerAvatarColor,
    },
    avgRating: Number(row.avgRating),
    reviewCount: row.reviewCount,
    isOwner: row.sellerId === viewerId,
  };
}

router.get("/marketplace/products", withCurrentUser, async (req, res) => {
  const rows = await db
    .select({ id: marketplaceProductsTable.id })
    .from(marketplaceProductsTable)
    .orderBy(desc(marketplaceProductsTable.createdAt))
    .limit(50);

  const products = await Promise.all(rows.map((r) => buildProduct(r.id, req.currentUserId!)));
  res.json(products.filter(Boolean));
});

router.get("/marketplace/products/:id", withCurrentUser, async (req, res) => {
  const product = await buildProduct(Number(req.params.id), req.currentUserId!);
  if (!product) {
    res.status(404).json({ error: "not_found" });
    return;
  }
  res.json(product);
});

router.post("/marketplace/products", withCurrentUser, async (req, res) => {
  const body = CreateProductBody.parse(req.body);
  const [created] = await db
    .insert(marketplaceProductsTable)
    .values({
      sellerId: req.currentUserId!,
      title: body.title,
      description: body.description,
      price: String(body.price),
      images: body.images,
      category: body.category,
      contactInfo: body.contactInfo ?? null,
    })
    .returning({ id: marketplaceProductsTable.id });

  const product = await buildProduct(created.id, req.currentUserId!);
  res.json(product);
});

router.patch("/marketplace/products/:id", withCurrentUser, async (req, res) => {
  const id = Number(req.params.id);
  const [existing] = await db
    .select()
    .from(marketplaceProductsTable)
    .where(eq(marketplaceProductsTable.id, id))
    .limit(1);

  if (!existing) { res.status(404).json({ error: "not_found" }); return; }
  if (existing.sellerId !== req.currentUserId!) { res.status(403).json({ error: "forbidden" }); return; }

  const body = CreateProductBody.parse(req.body);
  await db
    .update(marketplaceProductsTable)
    .set({
      title: body.title,
      description: body.description,
      price: String(body.price),
      images: body.images.length > 0 ? body.images : existing.images,
      category: body.category,
      contactInfo: body.contactInfo ?? null,
    })
    .where(eq(marketplaceProductsTable.id, id));

  const product = await buildProduct(id, req.currentUserId!);
  res.json(product);
});

router.delete("/marketplace/products/:id", withCurrentUser, async (req, res) => {
  const id = Number(req.params.id);
  const [existing] = await db
    .select()
    .from(marketplaceProductsTable)
    .where(eq(marketplaceProductsTable.id, id))
    .limit(1);

  if (!existing) { res.status(404).json({ error: "not_found" }); return; }
  if (existing.sellerId !== req.currentUserId!) { res.status(403).json({ error: "forbidden" }); return; }

  await db.delete(marketplaceProductsTable).where(eq(marketplaceProductsTable.id, id));
  res.json({ ok: true });
});

router.get("/marketplace/products/:id/reviews", withCurrentUser, async (req, res) => {
  const id = Number(req.params.id);
  const rows = await db
    .select({
      id: productReviewsTable.id,
      rating: productReviewsTable.rating,
      comment: productReviewsTable.comment,
      createdAt: productReviewsTable.createdAt,
      reviewerUsername: usersTable.username,
      reviewerAvatarColor: usersTable.avatarColor,
      reviewerId: productReviewsTable.reviewerId,
    })
    .from(productReviewsTable)
    .innerJoin(usersTable, eq(usersTable.id, productReviewsTable.reviewerId))
    .where(eq(productReviewsTable.productId, id))
    .orderBy(desc(productReviewsTable.createdAt));

  res.json(
    rows.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt.toISOString(),
      reviewer: {
        id: r.reviewerId,
        username: r.reviewerUsername ?? "unknown",
        avatarColor: r.reviewerAvatarColor,
      },
    })),
  );
});

router.post("/marketplace/products/:id/reviews", withCurrentUser, async (req, res) => {
  const id = Number(req.params.id);
  const body = CreateReviewBody.parse(req.body);

  const [product] = await db
    .select()
    .from(marketplaceProductsTable)
    .where(eq(marketplaceProductsTable.id, id))
    .limit(1);
  if (!product) { res.status(404).json({ error: "not_found" }); return; }

  const [existing] = await db
    .select()
    .from(productReviewsTable)
    .where(
      and(
        eq(productReviewsTable.productId, id),
        eq(productReviewsTable.reviewerId, req.currentUserId!),
      ),
    )
    .limit(1);

  let reviewId: number;
  if (existing) {
    await db
      .update(productReviewsTable)
      .set({ rating: body.rating, comment: body.comment ?? null })
      .where(eq(productReviewsTable.id, existing.id));
    reviewId = existing.id;
  } else {
    const [created] = await db
      .insert(productReviewsTable)
      .values({
        productId: id,
        reviewerId: req.currentUserId!,
        rating: body.rating,
        comment: body.comment ?? null,
      })
      .returning({ id: productReviewsTable.id });
    reviewId = created.id;
  }

  const [row] = await db
    .select({
      id: productReviewsTable.id,
      rating: productReviewsTable.rating,
      comment: productReviewsTable.comment,
      createdAt: productReviewsTable.createdAt,
      reviewerUsername: usersTable.username,
      reviewerAvatarColor: usersTable.avatarColor,
      reviewerId: productReviewsTable.reviewerId,
    })
    .from(productReviewsTable)
    .innerJoin(usersTable, eq(usersTable.id, productReviewsTable.reviewerId))
    .where(eq(productReviewsTable.id, reviewId));

  res.json({
    id: row.id,
    rating: row.rating,
    comment: row.comment,
    createdAt: row.createdAt.toISOString(),
    reviewer: {
      id: row.reviewerId,
      username: row.reviewerUsername ?? "unknown",
      avatarColor: row.reviewerAvatarColor,
    },
  });
});

export default router;
