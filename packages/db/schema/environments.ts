import { text, serial, pgTable } from "drizzle-orm/pg-core";
import { timestamps } from "./utils"

export const environments = pgTable("environments", {
  id: serial().primaryKey(),
  name: text().notNull(),
  ...timestamps,
})
