import { t } from "elysia";

import {
  AgentInputCreate,
  AgentInputUpdate,
  AgentPlain,
  AgentRelations,
} from "@hebo/database/src/generated/prismabox/Agent";
import supportedModels from "@hebo/shared-data/json/supported-models";

const SupportedModels = supportedModels.map(({ name }) => name) as [
  string,
  ...string[],
];
// FUTURE: move to shared-api
export const SupportedModelEnum = t.UnionEnum(SupportedModels, {
  error() {
    return "Invalid model name";
  },
});

// DTOs
const AgentRelationItemProperties =
  AgentRelations.properties.branches.items.properties;
const Branch = t.Object(
  {
    slug: AgentRelationItemProperties.slug,
    name: t.Optional(AgentRelationItemProperties.name),
    models: t.Optional(AgentRelationItemProperties.models),
  },
  { additionalProperties: false },
);
export const Agent = t.Composite([
  AgentPlain,
  t.Object({ branches: t.Array(Branch) }),
]);

// The create agent schema accepts a default model name which is later used to insert the branch record for that agent.
export const CreateBody = t.Composite([
  AgentInputCreate,
  t.Object({
    defaultModel: SupportedModelEnum,
  }),
]);
export const UpdateBody = AgentInputUpdate;
export const AgentList = t.Array(Agent);
export const NoContent = t.Void();
export const PathParam = t.Object({
  agentSlug: AgentPlain.properties.slug,
});

// Types
export type CreateBody = typeof CreateBody.static;
export type UpdateBody = typeof UpdateBody.static;
