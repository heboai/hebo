import { text, serial, pgTable, timestamp, integer } from "drizzle-orm/pg-core";
import { version } from "./version.sql";

export const agent = pgTable("agent", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  userId: text("user_id").notNull(),
  versionId: integer("version_id").references(() => version.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
}); 