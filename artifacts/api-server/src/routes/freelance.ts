import { Router, type IRouter } from "express";
import {
  db,
  freelanceServicesTable,
  serviceReviewsTable,
  usersTable,
} from "@workspace/db";
import { and, desc, eq, sql } from "drizzle-orm";
import { withCurrentUser } from "../lib/auth";
import { z } from "zod";

const router: IRouter = Router();

const imagePath = z
  .string()
  .refine((value) => value.startsWith("/"), "Must be a storage path or URL");

const CreateServiceBody = z.object({
  title: z.string().min(1).max(120),
  description: z.string().min(1).max(2000),
  price: z.number().min(0),
  category: z.string().min(1).max(60),
  images: z.array(z.union([z.string().url(), imagePath])).max(5).default([]),
  contactInfo: z.string().max(200).optional(),
  deliveryDays: z.number().int().min(1).max(365).default(7),
});

const CreateReviewBody = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});

async function buildService(id: number, viewerId: number) {
  const [row] = await db
    .select({
      id: freelanceServicesTable.id,
      title: freelanceServicesTable.title,
      description: freelanceServicesTable.description,
      price: freelanceServicesTable.price,
      category: freelanceServicesTable.category,
      images: freelanceServicesTable.images,
      contactInfo: freelanceServicesTable.contactInfo,
      deliveryDays: freelanceServicesTable.deliveryDays,
      createdAt: freelanceServicesTable.createdAt,
      providerId: freelanceServicesTable.providerId,
      providerUsername: usersTable.username,
      providerAvatarColor: usersTable.avatarColor,
      avgRating: sql<number>`coalesce(
        (select avg(rating)::numeric(3,1) from ${serviceReviewsTable}
         where ${serviceReviewsTable.serviceId} = ${freelanceServicesTable.id}), 0
      )`.as("avg_rating"),
      reviewCount: sql<number>`(
        select count(*)::int from ${serviceReviewsTable}
        where ${serviceReviewsTable.serviceId} = ${freelanceServicesTable.id}
      )`.as("review_count"),
    })
    .from(freelanceServicesTable)
    .innerJoin(usersTable, eq(usersTable.id, freelanceServicesTable.providerId))
    .where(eq(freelanceServicesTable.id, id));

  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    price: row.price,
    category: row.category,
    images: row.images,
    contactInfo: row.contactInfo,
    deliveryDays: row.deliveryDays,
    createdAt: row.createdAt.toISOString(),
    provider: {
      id: row.providerId,
      username: row.providerUsername ?? "unknown",
      avatarColor: row.providerAvatarColor,
    },
    avgRating: Number(row.avgRating),
    reviewCount: row.reviewCount,
    isOwner: row.providerId === viewerId,
  };
}

router.get("/freelance/services", withCurrentUser, async (req, res) => {
  const category = req.query.category ? String(req.query.category) : undefined;
  const query = db
    .select({ id: freelanceServicesTable.id })
    .from(freelanceServicesTable)
    .orderBy(desc(freelanceServicesTable.createdAt))
    .limit(50);

  if (category) {
    query.where(eq(freelanceServicesTable.category, category));
  }

  const rows = await query;
  const services = await Promise.all(rows.map((r) => buildService(r.id, req.currentUserId!)));
  res.json(services.filter(Boolean));
});

router.get("/freelance/services/:id", withCurrentUser, async (req, res) => {
  const service = await buildService(Number(req.params.id), req.currentUserId!);
  if (!service) {
    res.status(404).json({ error: "not_found" });
    return;
  }
  res.json(service);
});

router.post("/freelance/services", withCurrentUser, async (req, res) => {
  const body = CreateServiceBody.parse(req.body);
  const [created] = await db
    .insert(freelanceServicesTable)
    .values({
      providerId: req.currentUserId!,
      title: body.title,
      description: body.description,
      price: String(body.price),
      category: body.category,
      images: body.images,
      contactInfo: body.contactInfo ?? null,
      deliveryDays: body.deliveryDays,
    })
    .returning({ id: freelanceServicesTable.id });

  const service = await buildService(created.id, req.currentUserId!);
  res.json(service);
});

router.patch("/freelance/services/:id", withCurrentUser, async (req, res) => {
  const id = Number(req.params.id);
  const [existing] = await db
    .select()
    .from(freelanceServicesTable)
    .where(eq(freelanceServicesTable.id, id))
    .limit(1);

  if (!existing) { res.status(404).json({ error: "not_found" }); return; }
  if (existing.providerId !== req.currentUserId!) { res.status(403).json({ error: "forbidden" }); return; }

  const body = CreateServiceBody.parse(req.body);
  await db
    .update(freelanceServicesTable)
    .set({
      title: body.title,
      description: body.description,
      price: String(body.price),
      category: body.category,
      images: body.images.length > 0 ? body.images : existing.images,
      contactInfo: body.contactInfo ?? null,
      deliveryDays: body.deliveryDays,
    })
    .where(eq(freelanceServicesTable.id, id));

  const service = await buildService(id, req.currentUserId!);
  res.json(service);
});

router.delete("/freelance/services/:id", withCurrentUser, async (req, res) => {
  const id = Number(req.params.id);
  const [existing] = await db
    .select()
    .from(freelanceServicesTable)
    .where(eq(freelanceServicesTable.id, id))
    .limit(1);

  if (!existing) { res.status(404).json({ error: "not_found" }); return; }
  if (existing.providerId !== req.currentUserId!) { res.status(403).json({ error: "forbidden" }); return; }

  await db.delete(freelanceServicesTable).where(eq(freelanceServicesTable.id, id));
  res.json({ ok: true });
});

router.get("/freelance/services/:id/reviews", withCurrentUser, async (req, res) => {
  const id = Number(req.params.id);
  const rows = await db
    .select({
      id: serviceReviewsTable.id,
      rating: serviceReviewsTable.rating,
      comment: serviceReviewsTable.comment,
      createdAt: serviceReviewsTable.createdAt,
      reviewerUsername: usersTable.username,
      reviewerAvatarColor: usersTable.avatarColor,
      reviewerId: serviceReviewsTable.reviewerId,
    })
    .from(serviceReviewsTable)
    .innerJoin(usersTable, eq(usersTable.id, serviceReviewsTable.reviewerId))
    .where(eq(serviceReviewsTable.serviceId, id))
    .orderBy(desc(serviceReviewsTable.createdAt));

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

router.post("/freelance/services/:id/reviews", withCurrentUser, async (req, res) => {
  const id = Number(req.params.id);
  const body = CreateReviewBody.parse(req.body);

  const [service] = await db
    .select()
    .from(freelanceServicesTable)
    .where(eq(freelanceServicesTable.id, id))
    .limit(1);
  if (!service) { res.status(404).json({ error: "not_found" }); return; }

  const [existing] = await db
    .select()
    .from(serviceReviewsTable)
    .where(
      and(
        eq(serviceReviewsTable.serviceId, id),
        eq(serviceReviewsTable.reviewerId, req.currentUserId!),
      ),
    )
    .limit(1);

  let reviewId: number;
  if (existing) {
    await db
      .update(serviceReviewsTable)
      .set({ rating: body.rating, comment: body.comment ?? null })
      .where(eq(serviceReviewsTable.id, existing.id));
    reviewId = existing.id;
  } else {
    const [created] = await db
      .insert(serviceReviewsTable)
      .values({
        serviceId: id,
        reviewerId: req.currentUserId!,
        rating: body.rating,
        comment: body.comment ?? null,
      })
      .returning({ id: serviceReviewsTable.id });
    reviewId = created.id;
  }

  const [row] = await db
    .select({
      id: serviceReviewsTable.id,
      rating: serviceReviewsTable.rating,
      comment: serviceReviewsTable.comment,
      createdAt: serviceReviewsTable.createdAt,
      reviewerUsername: usersTable.username,
      reviewerAvatarColor: usersTable.avatarColor,
      reviewerId: serviceReviewsTable.reviewerId,
    })
    .from(serviceReviewsTable)
    .innerJoin(usersTable, eq(usersTable.id, serviceReviewsTable.reviewerId))
    .where(eq(serviceReviewsTable.id, reviewId));

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
