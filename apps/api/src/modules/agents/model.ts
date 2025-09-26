import { t } from "elysia";

import {
  Agent,
  AgentInputCreate,
  AgentInputUpdate,
} from "@hebo/database/src/generated/prismabox/Agent";
export { Agent } from "@hebo/database/src/generated/prismabox/Agent";
import supportedModels from "@hebo/shared-data/json/supported-models";

const SupportedModelNames: ReadonlySet<string> = new Set(
  supportedModels.map((m) => m.name),
);

// DTOs
// The create agent schema accepts a default model name which is later used to insert the branch record for that agent.
export const CreateBody = t.Composite([
  AgentInputCreate,
  t.Object({
    defaultModel: t.String({ enum: [...SupportedModelNames] }),
  }),
]);
export const UpdateBody = AgentInputUpdate;
export const AgentList = t.Array(Agent);
export const NoContent = t.Void();
export const PathParam = t.Object({
  agentSlug: Agent.properties.slug,
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
