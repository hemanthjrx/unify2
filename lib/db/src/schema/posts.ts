import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  primaryKey,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { communitiesTable } from "./communities";

export const postsTable = pgTable(
  "posts",
  {
    id: serial("id").primaryKey(),
    authorId: integer("author_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    communityId: integer("community_id").references(() => communitiesTable.id, {
      onDelete: "set null",
    }),
    body: text("body").notNull(),
    kind: text("kind").notNull().default("post"), // 'post' | 'hackathon'
    hackathonDate: text("hackathon_date"),
    hackathonLocation: text("hackathon_location"),
    hackathonTeamSize: integer("hackathon_team_size"),
    hackathonSkills: text("hackathon_skills").array().default([]),
    hackathonFilled: boolean("hackathon_filled").notNull().default(false),
    images: text("images").array().notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    authorIdx: index("posts_author_idx").on(t.authorId),
    communityIdx: index("posts_community_idx").on(t.communityId),
    createdIdx: index("posts_created_idx").on(t.createdAt),
  }),
);

export const postLikesTable = pgTable(
  "post_likes",
  {
    postId: integer("post_id")
      .notNull()
      .references(() => postsTable.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.postId, t.userId] }),
  }),
);

export const postCommentsTable = pgTable(
  "post_comments",
  {
    id: serial("id").primaryKey(),
    postId: integer("post_id")
      .notNull()
      .references(() => postsTable.id, { onDelete: "cascade" }),
    authorId: integer("author_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    postIdx: index("post_comments_post_idx").on(t.postId),
    authorIdx: index("post_comments_author_idx").on(t.authorId),
  }),
);

export type Post = typeof postsTable.$inferSelect;
export type PostComment = typeof postCommentsTable.$inferSelect;
