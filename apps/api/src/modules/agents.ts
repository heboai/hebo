import { Elysia, status, t } from "elysia";

import { createAgentRepo } from "@hebo/database/repository";
import {
  agentsInputCreate,
  agentsInputUpdate,
  agentsPlain,
  agentsRelations,
} from "@hebo/database/src/generated/prismabox/agents";
import { authService } from "@hebo/shared-api/auth/auth-service";

import { SupportedModelEnum } from "~api/modules/branches";

const agentsRelationItemProperties =
  agentsRelations.properties.branches.items.properties;
const Branch = t.Object(
  {
    slug: agentsRelationItemProperties.slug,
    name: t.Optional(agentsRelationItemProperties.name),
    models: t.Optional(agentsRelationItemProperties.models),
  },
  { additionalProperties: false },
);
const agents = t.Composite([
  agentsPlain,
  t.Object({ branches: t.Array(Branch) }),
]);
const branchExpandParam = t.Object({
  expand: t.Optional(t.Literal("branches")),
});

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
      response: { 200: t.Array(agents) },
    },
  )
  .post(
    "/",
    async ({ body, userId, query }) => {
      const expandBranches = query.expand === "branches";
      const agent = await createAgentRepo(userId!).create(
        body.name,
        body.defaultModel,
        expandBranches,
      );
      return status(201, agent);
    },
    {
      query: branchExpandParam,
      body: t.Composite([
        agentsInputCreate,
        t.Object({
          defaultModel: SupportedModelEnum,
        }),
      ]),
      response: { 201: agents },
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
      response: { 200: agents },
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
      body: agentsInputUpdate,
      response: { 200: agents },
    },
  )
  .delete(
    "/:agentSlug",
    async ({ params, userId }) => {
      await createAgentRepo(userId!).softDelete(params.agentSlug);
      status(204);
    },
    {
      response: { 204: t.Void() },
    },
  );
