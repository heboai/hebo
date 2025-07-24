import { uniqueIndex, text, serial, pgTable } from "drizzle-orm/pg-core";
import { timestamps } from "./utils"

export const models = pgTable("models", {
  id: serial().primaryKey(),
  code: text().notNull(),
  name: text().notNull(),
  sub_text: text(),
  ...timestamps,
}, (table) => [
  uniqueIndex("code_idx").on(table.code),
])
