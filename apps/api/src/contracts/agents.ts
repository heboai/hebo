import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-typebox";
import { t } from "elysia";

import { agents } from "@hebo/db/schema/agents";

export const _selectAgent = createSelectSchema(agents);

export const createAgent = createInsertSchema(agents);
export const updateAgent = createUpdateSchema(agents);
export const selectAgent = t.Object({
  agentSlug: _selectAgent.properties.slug,
});
