import { text, timestamp } from "drizzle-orm/pg-core";

export const audits = {
  created_by: text("created_by").notNull(),
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updated_by: text("updated_by").notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  deleted_by: text("deleted_by"),
  deleted_at: timestamp("deleted_at", { withTimezone: true }),
};
