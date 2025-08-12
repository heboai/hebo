import { text, bigserial, pgTable, jsonb, integer } from "drizzle-orm/pg-core";

import { agents } from "./agents";
import { audits } from "./audits";

export const branches = pgTable("branches", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  agentId: integer("agent_id")
    .references(() => agents.id, { onDelete: "cascade" })
    .notNull(),
  name: text("name").notNull().default("main"),
  models: jsonb("models").notNull(),
  ...audits,
});
