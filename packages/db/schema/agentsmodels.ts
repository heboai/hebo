import { integer, pgTable } from "drizzle-orm/pg-core"
import { agents } from "./agents";
import { models } from "./models";
import { timestamps } from "./utils"

export const agentsmodels = pgTable("agentsmodels", {
  agent_id: integer().notNull().references(() => agents.id, { onDelete: "cascade"}),
  model_id: integer().notNull().references(() => models.id, { onDelete: "cascade"}),
  ...timestamps,
})
