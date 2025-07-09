import { text, integer, sqliteTable } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const version = sqliteTable("version", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  version: text("version").notNull().default("main"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`CURRENT_TIMESTAMP`),
}); 