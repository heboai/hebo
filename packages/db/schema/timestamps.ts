import { timestamp } from "drizzle-orm/pg-core"

export const timestamps = {
  updated_at: timestamp("updated_at").defaultNow().notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  deleted_at: timestamp("deleted_at"),
}
