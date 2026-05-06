import {
  pgTable,
  integer,
  primaryKey,
  timestamp,
  text,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const followsTable = pgTable(
  "follows",
  {
    followerId: integer("follower_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    followeeId: integer("followee_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("pending"), // 'pending' | 'accepted'
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.followerId, t.followeeId] }),
  }),
);
