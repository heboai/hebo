import { isNull, sql } from "drizzle-orm";
import {
  pgTable,
  jsonb,
  uuid,
  uniqueIndex,
  index,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";

import { agents } from "./agents";
import { audit } from "./mixin/audit";
import { slug } from "./mixin/slug";

type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export const branches = pgTable(
  "branches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    agentId: uuid("agent_id")
      .references((): AnyPgColumn => agents.id, { onDelete: "cascade" })
      .notNull(),
    ...slug,
    models: jsonb("models").$type<Json>().notNull(),
    ...audit,
  },
  (table) => [
    // Case-insensitive unique slug per agent
    uniqueIndex("unique_slug_per_agent")
      .on(table.agentId, sql`LOWER(${table.slug})`)
      .where(isNull(table.deletedAt)),

    // Speed up list queries: WHERE agentId = ? AND deletedAt IS NULL ORDER BY createdAt
    index("idx_branches_agent_created_at_not_deleted")
      .on(table.agentId, table.createdAt)
      .where(isNull(table.deletedAt)),

    // Speed up get-by-slug within an agent with soft-delete filter
    index("idx_branches_agent_slug_not_deleted")
      .on(table.agentId, table.slug)
      .where(isNull(table.deletedAt)),
  ],
);
