import { isNull } from "drizzle-orm";
import {
  pgTable,
  jsonb,
  uuid,
  uniqueIndex,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";

import { agents } from "./agents";
import { audit } from "./mixin/audit";
import { slug, createSlugLowercaseCheck } from "./mixin/slug";

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
    // Enforce lowercase slug at the DB level
    createSlugLowercaseCheck("branches", table),
    // Unique slug per agent for non-deleted rows
    uniqueIndex("unique_slug_per_agent")
      .on(table.agentId, table.slug)
      .where(isNull(table.deletedAt)),
  ],
);
