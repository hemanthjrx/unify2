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

export const marketplaceProductsTable = pgTable(
  "marketplace_products",
  {
    id: serial("id").primaryKey(),
    sellerId: integer("seller_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull(),
    price: numeric("price", { precision: 10, scale: 2 }).notNull(),
    images: text("images").array().notNull().default([]),
    category: text("category").notNull().default("other"),
    contactInfo: text("contact_info"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => ({
    sellerIdx: index("marketplace_products_seller_idx").on(t.sellerId),
    createdIdx: index("marketplace_products_created_idx").on(t.createdAt),
  }),
);

export const productReviewsTable = pgTable(
  "product_reviews",
  {
    id: serial("id").primaryKey(),
    productId: integer("product_id")
      .notNull()
      .references(() => marketplaceProductsTable.id, { onDelete: "cascade" }),
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
    productIdx: index("product_reviews_product_idx").on(t.productId),
  }),
);

export type MarketplaceProduct = typeof marketplaceProductsTable.$inferSelect;
export type ProductReview = typeof productReviewsTable.$inferSelect;
