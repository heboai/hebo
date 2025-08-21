import { isNull, sql } from "drizzle-orm";
import { uuid, pgTable, uniqueIndex } from "drizzle-orm/pg-core";

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
  ],
);
