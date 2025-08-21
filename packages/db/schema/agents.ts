import { isNull } from "drizzle-orm";
import { uuid, pgTable, uniqueIndex } from "drizzle-orm/pg-core";

import { audit } from "./mixin/audit";
import { slug, createSlugLowercaseCheck } from "./mixin/slug";

export const agents = pgTable(
  "agents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ...slug,
    ...audit,
  },
  (table) => [
    // Enforce lowercase slug at the DB level
    createSlugLowercaseCheck("agents", table),
    // Unique slug for non-deleted rows
    uniqueIndex("unique_slug").on(table.slug).where(isNull(table.deletedAt)),
  ],
);
