import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const activityTable = pgTable("activity", {
  id: serial("id").primaryKey(),
  actorId: integer("actor_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(),
  message: text("message").notNull(),
  targetName: text("target_name"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
