import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-typebox";
import { t } from "elysia";

import { agents } from "@hebo/db/schema/agents";

import { omitCommon } from "./common";

const _selectAgent = createSelectSchema(agents);
const _createAgent = createInsertSchema(agents);
const _updateAgent = createUpdateSchema(agents);

export const createAgent = omitCommon(_createAgent);
export const updateAgent = omitCommon(_updateAgent);

export const selectAgent = t.Object({
  agentSlug: _selectAgent.properties.slug,
});
