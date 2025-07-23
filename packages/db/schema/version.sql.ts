import { text, serial, pgTable, timestamp } from "drizzle-orm/pg-core";

export const version = pgTable("version", {
  id: serial("id").primaryKey(),
  version: text("version").notNull().default("main"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}); 