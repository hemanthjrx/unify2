import {
  pgTable,
  serial,
  text,
  integer,
  numeric,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const freelanceServicesTable = pgTable(
  "freelance_services",
  {
    id: serial("id").primaryKey(),
    providerId: integer("provider_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull(),
    price: numeric("price", { precision: 10, scale: 2 }).notNull(),
    category: text("category").notNull(),
    images: text("images").array().notNull().default([]),
    contactInfo: text("contact_info"),
    deliveryDays: integer("delivery_days").notNull().default(7),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => ({
    providerIdx: index("freelance_services_provider_idx").on(t.providerId),
    categoryIdx: index("freelance_services_category_idx").on(t.category),
    createdIdx: index("freelance_services_created_idx").on(t.createdAt),
  }),
);

export const serviceReviewsTable = pgTable(
  "service_reviews",
  {
    id: serial("id").primaryKey(),
    serviceId: integer("service_id")
      .notNull()
      .references(() => freelanceServicesTable.id, { onDelete: "cascade" }),
    reviewerId: integer("reviewer_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(),
    comment: text("comment"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    serviceIdx: index("service_reviews_service_idx").on(t.serviceId),
  }),
);

export type FreelanceService = typeof freelanceServicesTable.$inferSelect;
export type ServiceReview = typeof serviceReviewsTable.$inferSelect;
