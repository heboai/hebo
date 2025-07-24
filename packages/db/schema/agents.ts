import { integer, text, serial, pgTable } from "drizzle-orm/pg-core";
import { environments } from "./environments";
import { timestamps } from "./utils"

export const agents = pgTable("agents", {
  id: serial().primaryKey(),
  environment_id: integer().notNull().references(() => environments.id, { onDelete: "cascade"}),
  name: text().notNull(),
  description: text(),
  ...timestamps,
})
