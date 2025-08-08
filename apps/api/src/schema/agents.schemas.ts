import { createSchemaFactory } from "drizzle-typebox";
import { t } from "elysia";

import { agents } from "@hebo/db/schema/agents";

const { createInsertSchema, createSelectSchema, createUpdateSchema } =
  createSchemaFactory({ typeboxInstance: t });

export const AgentInsert = createInsertSchema(agents);

export const AgentSelect = createSelectSchema(agents);

export const AgentUpdate = createUpdateSchema(agents);
