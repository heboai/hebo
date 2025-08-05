import { text, serial, pgTable, jsonb, uniqueIndex, integer } from "drizzle-orm/pg-core";
import { timestamps } from "./timestamps"
import { agents } from "./agents"

export const branches = pgTable("branches", {
  id: serial("id").primaryKey(),
  agent_id: integer("agent_id").notNull().references(() => agents.id, { onDelete: "cascade"}),
  name: text("name").notNull().default("main"),
  models: jsonb("models").notNull(),
  ...timestamps,
}, (table) => ({
  agentIdNameUnique: uniqueIndex("branches_agent_id_name_unique_index").on(table.agent_id, table.name),
}))
