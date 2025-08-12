import { text, bigserial, pgTable, jsonb, bigint } from "drizzle-orm/pg-core";

import { agents } from "./agents";
import { audits } from "./audits";

export const branches = pgTable("branches", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  agentId: bigint("agent_id", { mode: "number" })
    .references(() => agents.id, { onDelete: "cascade" })
    .notNull(),
  name: text("name").notNull().default("main"),
  models: jsonb("models").notNull(),
  ...audits,
});
