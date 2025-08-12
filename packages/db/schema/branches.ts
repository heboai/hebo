import { isNull } from "drizzle-orm";
import { pgTable, jsonb, uuid, uniqueIndex } from "drizzle-orm/pg-core";

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
    ...slug({ unique: false }),
    models: jsonb("models").notNull(),
    ...audit,
  },
  (table) => [
    uniqueIndex("unique_slug_per_agent")
      .on(table.agentId, table.slug)
      .where(isNull(table.deletedAt)),
  ],
);
