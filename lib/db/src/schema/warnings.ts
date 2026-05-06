import {
  pgTable,
  serial,
  integer,
  text,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const warningStrikesTable = pgTable(
  "warning_strikes",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    issuedById: integer("issued_by_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    description: text("description").notNull(),
    screenshotUrl: text("screenshot_url"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    userIdx: index("warning_strikes_user_idx").on(t.userId),
  }),
);

export type WarningStrike = typeof warningStrikesTable.$inferSelect;
