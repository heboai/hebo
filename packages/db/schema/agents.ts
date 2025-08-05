import { text, serial, pgTable } from "drizzle-orm/pg-core";
import { timestamps } from "./timestamps"

export const agents = pgTable("agents", {
  id: serial("id").primaryKey(),
  user_id: text("user_id").notNull(),
  name: text("name").notNull(),
  ...timestamps,
})
