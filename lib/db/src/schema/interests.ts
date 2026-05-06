import {
  pgTable,
  serial,
  text,
  integer,
  primaryKey,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const interestsTable = pgTable("interests", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  category: text("category").notNull(),
  emoji: text("emoji"),
});

export const userInterestsTable = pgTable(
  "user_interests",
  {
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    interestId: integer("interest_id")
      .notNull()
      .references(() => interestsTable.id, { onDelete: "cascade" }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.interestId] }),
  }),
);

export type Interest = typeof interestsTable.$inferSelect;
