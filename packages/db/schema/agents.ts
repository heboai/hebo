import { isNull, sql } from "drizzle-orm";
import { uuid, pgTable, uniqueIndex, index } from "drizzle-orm/pg-core";

import { audit } from "./mixin/audit";
import { slug } from "./mixin/slug";

export const agents = pgTable(
  "agents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ...slug,
    ...audit,
  },
  (table) => [
    // Case-insensitive unique slug for non-deleted rows
    uniqueIndex("unique_slug")
      .on(sql`LOWER(${table.slug})`)
      .where(isNull(table.deletedAt)),

    // Speed up listing with soft-delete filter and ordering by createdAt
    index("idx_agents_created_at_not_deleted")
      .on(table.createdAt)
      .where(isNull(table.deletedAt)),

    // Speed up slug lookups that use equality on the raw slug with soft-delete filter
    index("idx_agents_slug_not_deleted")
      .on(table.slug)
      .where(isNull(table.deletedAt)),
  ],
);
