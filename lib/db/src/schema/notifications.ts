import {
  pgTable,
  serial,
  integer,
  text,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { postsTable } from "./posts";

export const notificationsTable = pgTable(
  "notifications",
  {
    id: serial("id").primaryKey(),
    recipientId: integer("recipient_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    actorId: integer("actor_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    type: text("type").notNull(), // "follow" | "like"
    postId: integer("post_id").references(() => postsTable.id, {
      onDelete: "cascade",
    }),
    read: boolean("read").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    recipientIdx: index("notifications_recipient_idx").on(t.recipientId),
    createdIdx: index("notifications_created_idx").on(t.createdAt),
  }),
);
