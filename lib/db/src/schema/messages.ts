import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const messagesTable = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  recipientId: integer("recipient_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  body: text("body"),
  kind: text("kind").notNull().default("text"), // 'text' | 'image' | 'pdf' | 'document'
  fileUrl: text("file_url"),
  fileName: text("file_name"),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Message = typeof messagesTable.$inferSelect;
