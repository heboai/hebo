import { Elysia, t } from "elysia";

import { createAgentRepo } from "@hebo/database/repository";
import {
  AgentInputCreate,
  AgentInputUpdate,
  AgentPlain,
  AgentRelations,
} from "@hebo/database/src/generated/prismabox/Agent";
import { authService } from "@hebo/shared-api/auth/auth-service";
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
const Agent = t.Composite([
  AgentPlain,
  t.Object({ branches: t.Array(Branch) }),
]);

export const agentsModule = new Elysia({
  prefix: "/agents",
})
  .use(authService)
  .derive(({ query }) => ({
    expandBranches: query.expand === "branches",
  }))
  .get(
    "/",
    async ({ userId, expandBranches }) => {
      return createAgentRepo(userId!).getAll(expandBranches);
    },
    { response: { 200: t.Array(Agent) } },
  )
  .post(
    "/",
    async ({ body, set, userId, expandBranches }) => {
      const agent = createAgentRepo(userId!).create(
        body.name,
        body.defaultModel,
        expandBranches,
      );
      set.status = 201;
      return agent;
    },
    {
      body: t.Composite([
        AgentInputCreate,
        t.Object({
          defaultModel: SupportedModelEnum,
        }),
      ]),
      response: { 201: Agent },
    },
  )
  .get(
    "/:agentSlug",
    async ({ params, userId, expandBranches }) => {
      return createAgentRepo(userId!).getBySlug(
        params.agentSlug,
        expandBranches,
      );
    },
    {
      response: { 200: Agent },
    },
  )
  .put(
    "/:agentSlug",
    async ({ body, params, userId, expandBranches }) => {
      return createAgentRepo(userId!).update(
        params.agentSlug,
        body.name,
        expandBranches,
      );
    },
    {
      body: AgentInputUpdate,
      response: { 200: Agent },
    },
  )
  .delete(
    "/:agentSlug",
    async ({ params, set, userId }) => {
      await createAgentRepo(userId!).softDelete(params.agentSlug);
      set.status = 204;
    },
    {
      response: { 204: t.Void() },
    },
  );
