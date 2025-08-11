import { text, bigserial, pgTable, jsonb } from "drizzle-orm/pg-core";

import { audits } from "./audits";
import { type Agent } from "./types/agent.schema";

export const branches = pgTable("branches", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  name: text("name").notNull().default("main"),
  agent: jsonb("agent").$type<Agent>().notNull(),
  ...audits,
});
