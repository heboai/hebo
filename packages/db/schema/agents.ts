import { integer, jsonb, text, serial, pgTable } from "drizzle-orm/pg-core";
import { environments } from "./environments";
import { timestamps } from "./timestamps"

export const agents = pgTable("agents", {
  id: serial().primaryKey(),
  environment_id: integer().notNull().references(() => environments.id, { onDelete: "cascade"}),
  name: text().notNull(),
  description: text(),
  models: jsonb().notNull(),
  ...timestamps,
})
