import { Elysia, t } from "elysia";

import { createAgentRepo } from "@hebo/database/repository";
import {
  AgentInputCreate,
  AgentInputUpdate,
  AgentPlain,
  AgentRelations,
} from "@hebo/database/src/generated/prismabox/Agent";
import { authService } from "@hebo/shared-api/auth/auth-service";

import { SupportedModelEnum } from "~api/modules/branches";

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

const branchExpandParam = t.Optional(
  t.Object({ expand: t.Literal("branches") }),
);

export const agentsModule = new Elysia({
  prefix: "/agents",
})
  .use(authService)
  .get(
    "/",
    async ({ userId, query }) => {
      const expandBranches = query.expand === "branches";
      return createAgentRepo(userId!).getAll(expandBranches);
    },
    {
      query: branchExpandParam,
      response: { 200: t.Array(Agent) },
    },
  )
  .post(
    "/",
    async ({ body, set, userId, query }) => {
      const expandBranches = query.expand === "branches";
      const agent = createAgentRepo(userId!).create(
        body.name,
        body.defaultModel,
        expandBranches,
      );
      set.status = 201;
      return agent;
    },
    {
      query: branchExpandParam,
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
    async ({ params, userId, query }) => {
      const expandBranches = query.expand === "branches";
      return createAgentRepo(userId!).getBySlug(
        params.agentSlug,
        expandBranches,
      );
    },
    {
      query: branchExpandParam,
      response: { 200: Agent },
    },
  )
  .patch(
    "/:agentSlug",
    async ({ body, params, userId, query }) => {
      const expandBranches = query.expand === "branches";
      return createAgentRepo(userId!).update(
        params.agentSlug,
        body.name,
        expandBranches,
      );
    },
    {
      query: branchExpandParam,
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
