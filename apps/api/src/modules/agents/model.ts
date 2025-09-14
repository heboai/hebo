import { t } from "elysia";

import { agents } from "@hebo/db/schema/agents";
import supportedModels from "@hebo/shared-data/json/supported-models";

import { BranchList } from "~api/modules/branches/model";
import {
  createSchemaFactory,
  AUDIT_FIELDS,
  ID_FIELDS,
} from "~api/utils/schema-factory";

const OMIT_FIELDS = [...AUDIT_FIELDS, ...ID_FIELDS] as const;
const { createInsertSchema, createUpdateSchema, createSelectSchema } =
  createSchemaFactory({ typeboxInstance: t });

const _createAgent = createInsertSchema(agents);
const _updateAgent = createUpdateSchema(agents);
const _selectAgent = createSelectSchema(agents);

export const SupportedModelNames: ReadonlySet<string> = new Set(
  supportedModels.map((m) => m.name),
);

// DTOs
// The create agent schema accepts a default model name which is later used to insert the branch record for that agent.
export const CreateBody = t.Intersect([
  t.Omit(_createAgent, [...OMIT_FIELDS, "slug"]),
  t.Object({
    defaultModel: t.String({ enum: [...SupportedModelNames] }),
  }),
]);
export const UpdateBody = t.Omit(_updateAgent, [...OMIT_FIELDS, "slug"]);
export const Agent = t.Omit(_selectAgent, [...OMIT_FIELDS]);
const AgentWithBranchSlugs = t.Intersect([
  Agent,
  t.Object({ branches: t.Array(t.String()) }),
]);
const AgentWithBranchObjects = t.Intersect([
  Agent,
  t.Object({ branches: BranchList }),
]);
export const AgentWithBranches = t.Union([
  AgentWithBranchSlugs,
  AgentWithBranchObjects,
]);
export const AgentList = t.Array(Agent);
export const NoContent = t.Void();
export const PathParam = t.Object({
  agentSlug: _createAgent.properties.slug,
});
export const QueryParam = t.Object({
  expand: t.Optional(t.Literal("branches")),
});

// Error DTOs
export const InvalidModel = t.Literal("Invalid model name");
export const AlreadyExists = t.Literal("Agent with this name already exists");
export const NotFound = t.Literal("Agent not found");

// Types
export type CreateBody = typeof CreateBody.static;
export type UpdateBody = typeof UpdateBody.static;
export type AgentExpand = (typeof QueryParam.static)["expand"];
