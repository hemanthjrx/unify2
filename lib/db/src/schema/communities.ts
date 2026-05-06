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

export const communitiesTable = pgTable("communities", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  accentColor: text("accent_color").notNull().default("#7c5cff"),
  icon: text("icon").notNull().default("💬"),
  imageUrl: text("image_url"),
  bannerImageUrl: text("banner_image_url"),
  profileImageUrl: text("profile_image_url"),
  leaderId: integer("leader_id").references(() => usersTable.id, { onDelete: "set null" }),
  tags: text("tags").array().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const communityMembersTable = pgTable(
  "community_members",
  {
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    communityId: integer("community_id")
      .notNull()
      .references(() => communitiesTable.id, { onDelete: "cascade" }),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.communityId] }),
  }),
);

export const communityMessagesTable = pgTable(
  "community_messages",
  {
    id: serial("id").primaryKey(),
    communityId: integer("community_id")
      .notNull()
      .references(() => communitiesTable.id, { onDelete: "cascade" }),
    authorId: integer("author_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    communityIdx: index("community_messages_community_idx").on(t.communityId),
    createdIdx: index("community_messages_created_idx").on(t.createdAt),
  }),
);

export type Community = typeof communitiesTable.$inferSelect;
