import { isNull, sql } from "drizzle-orm";
import { pgTable, jsonb, uuid, uniqueIndex } from "drizzle-orm/pg-core";

import { ModelsSchema } from "@hebo/shared-data/typebox/models";

import { agents } from "./agents";
import { audit } from "./mixin/audit";
import { slug } from "./mixin/slug";

export const branches = pgTable(
  "branches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    agentId: uuid("agent_id")
      .references(() => agents.id, { onDelete: "cascade" })
      .notNull(),
    ...slug,
    models: jsonb("models").$type<ModelsSchema>().notNull(),
    ...audit,
  },
  (table) => [
    // Case-insensitive unique slug per agent
    uniqueIndex("unique_slug_per_agent")
      .on(table.agentId, sql`LOWER(${table.slug})`)
      .where(isNull(table.deletedAt)),
  ],
);
