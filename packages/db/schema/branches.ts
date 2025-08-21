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

type JsonValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JsonValue }
  | JsonValue[];

export const branches = pgTable(
  "branches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    agentId: uuid("agent_id")
      .references((): AnyPgColumn => agents.id, { onDelete: "cascade" })
      .notNull(),
    ...slug,
    models: jsonb("models").$type<JsonValue>().notNull(),
    ...audit,
  },
  (table) => [
    // Enforce lowercase slug at the DB level
    createSlugLowercaseCheck("branches", table),
    // Unique slug per agent for non-deleted rows
    uniqueIndex("unique_slug_per_agent").on(table.agentId, table.slug),
  ],
);
