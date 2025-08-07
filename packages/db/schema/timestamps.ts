import { timestamp } from "drizzle-orm/pg-core";

export const timestamps = {
  updated_at: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  deleted_at: timestamp("deleted_at", { withTimezone: true }),
};
