import {
  pgTable,
  serial,
  text,
  integer,
  primaryKey,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const announcementsTable = pgTable(
  "announcements",
  {
    id: serial("id").primaryKey(),
    authorId: integer("author_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    body: text("body").notNull(),
    images: text("images").array().notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    createdIdx: index("announcements_created_idx").on(t.createdAt),
  }),
);

export const announcementLikesTable = pgTable(
  "announcement_likes",
  {
    announcementId: integer("announcement_id")
      .notNull()
      .references(() => announcementsTable.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.announcementId, t.userId] }),
  }),
);

export const announcementCommentsTable = pgTable(
  "announcement_comments",
  {
    id: serial("id").primaryKey(),
    announcementId: integer("announcement_id")
      .notNull()
      .references(() => announcementsTable.id, { onDelete: "cascade" }),
    authorId: integer("author_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    annIdx: index("announcement_comments_ann_idx").on(t.announcementId),
  }),
);
