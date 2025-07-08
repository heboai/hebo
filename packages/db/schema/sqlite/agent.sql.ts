import { text, integer, sqliteTable } from "drizzle-orm/sqlite-core";
import { version } from "./version.sql";

export const agent = sqliteTable("agent", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  userId: text("user_id").notNull(),
  versionId: integer("version_id").references(() => version.id),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  deletedAt: integer("deleted_at", { mode: "timestamp" }),
}); 