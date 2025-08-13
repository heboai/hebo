import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-typebox";
import { t } from "elysia";

import { agents } from "@hebo/db/schema/agents";

const _selectAgent = createSelectSchema(agents);
const _createAgent = createInsertSchema(agents);
const _updateAgent = createUpdateSchema(agents);

export const createAgent = t.Pick(_createAgent, ["name"]);
export const updateAgent = t.Pick(_updateAgent, ["name"]);

export const selectAgent = t.Object({
  agentSlug: _selectAgent.properties.slug,
});
