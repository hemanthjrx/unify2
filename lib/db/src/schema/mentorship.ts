import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const mentorshipQuestionsTable = pgTable(
  "mentorship_questions",
  {
    id: serial("id").primaryKey(),
    authorId: integer("author_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    body: text("body").notNull(),
    tags: text("tags").array().notNull().default([]),
    isSolved: boolean("is_solved").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    authorIdx: index("mentorship_questions_author_idx").on(t.authorId),
    createdIdx: index("mentorship_questions_created_idx").on(t.createdAt),
  }),
);

export const mentorshipRepliesTable = pgTable(
  "mentorship_replies",
  {
    id: serial("id").primaryKey(),
    questionId: integer("question_id")
      .notNull()
      .references(() => mentorshipQuestionsTable.id, { onDelete: "cascade" }),
    authorId: integer("author_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    isHelpful: boolean("is_helpful").notNull().default(false),
    helpfulCount: integer("helpful_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    questionIdx: index("mentorship_replies_question_idx").on(t.questionId),
    authorIdx: index("mentorship_replies_author_idx").on(t.authorId),
  }),
);

export const mentorshipHelpfulVotesTable = pgTable(
  "mentorship_helpful_votes",
  {
    id: serial("id").primaryKey(),
    replyId: integer("reply_id")
      .notNull()
      .references(() => mentorshipRepliesTable.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    uniq: unique("mentorship_helpful_votes_reply_user_uniq").on(t.replyId, t.userId),
    replyIdx: index("mentorship_helpful_votes_reply_idx").on(t.replyId),
  }),
);
