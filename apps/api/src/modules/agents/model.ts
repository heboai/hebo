import { t } from "elysia";

import { agents } from "@hebo/db/schema/agents";
import supportedModels from "@hebo/shared-data/supported-models.json";

import {
  createSchemaFactory,
  AUDIT_FIELDS,
  ID_FIELDS,
} from "~/utils/schema-factory";

const { createInsertSchema, createUpdateSchema, createSelectSchema } =
  createSchemaFactory({ typeboxInstance: t });

const _createAgent = createInsertSchema(agents);
const _updateAgent = createUpdateSchema(agents);
const _selectAgent = createSelectSchema(agents);

const OMIT_FIELDS = [...AUDIT_FIELDS, ...ID_FIELDS] as const;

export const SupportedModelNames = new Set(supportedModels.map((m) => m.name));

// DTOs
// The create agent schema accepts a default model name which is later used to insert the branch record for that agent.
export const CreateBody = t.Intersect([
  t.Omit(_createAgent, [...OMIT_FIELDS, "slug"]),
  t.Object({
    defaultModel: t.String({ enum: [...SupportedModelNames] }),
  }),
]);
export type CreateBody = typeof CreateBody.static;

export const UpdateBody = t.Omit(_updateAgent, [...OMIT_FIELDS, "slug"]);
export type UpdateBody = typeof UpdateBody.static;

export const Agent = t.Omit(_selectAgent, [...OMIT_FIELDS]);
export type Agent = typeof Agent.static;

export const AgentList = t.Array(Agent);
export type AgentList = typeof AgentList.static;

export const NoContent = t.Void();
export type NoContent = typeof NoContent.static;

export const PathParam = t.Object({
  agentSlug: _createAgent.properties.slug,
});
export type PathParam = typeof PathParam.static;

// Error DTOs
export const InvalidModel = t.Literal("Invalid model name");
export type InvalidModel = typeof InvalidModel.static;

export const AlreadyExists = t.Literal("Agent with this name already exists");
export type AlreadyExists = typeof AlreadyExists.static;

export const NotFound = t.Literal("Agent not found");
export type NotFound = typeof NotFound.static;
