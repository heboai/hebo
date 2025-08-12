import { pgTable, jsonb, uuid } from "drizzle-orm/pg-core";

import { agents } from "./agents";
import { audit } from "./mixin/audit";
import { slug } from "./mixin/slug";

export const branches = pgTable("branches", {
  id: uuid("id").primaryKey().defaultRandom(),
  agentId: uuid("agent_id")
    .references(() => agents.id, { onDelete: "cascade" })
    .notNull(),
  ...slug,
  models: jsonb("models").notNull(),
  ...audit,
});
