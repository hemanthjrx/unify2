import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";

export const reportsTable = pgTable("reports", {
  id: serial("id").primaryKey(),
  reporterId: integer("reporter_id"),
  targetType: text("target_type").notNull(),
  targetId: integer("target_id"),
  targetUsn: text("target_usn"),
  description: text("description").notNull(),
  status: text("status").notNull().default("pending"),
  reviewNote: text("review_note"),
  reviewedBy: integer("reviewed_by"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Report = typeof reportsTable.$inferSelect;
