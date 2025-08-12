import { sql } from "drizzle-orm";
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
  (table) => [uniqueIndex("unique_slug").on(sql`LOWER(${table.slug})`)],
);
