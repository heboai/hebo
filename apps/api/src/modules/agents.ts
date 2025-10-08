import { Elysia, status, t } from "elysia";

import { createAgentRepo } from "@hebo/database/repository";
import {
  agentsInputCreate,
  agentsInputUpdate,
  agentsPlain,
  agentsRelations,
} from "@hebo/database/src/generated/prismabox/agents";
import { authService } from "@hebo/shared-api/auth/auth-service";

import { supportedModelsUnion } from "~api/modules/branches";

const agentsRelationItemProperties =
  agentsRelations.properties.branches.items.properties;
const branches = t.Object({
  slug: agentsRelationItemProperties.slug,
  name: t.Optional(agentsRelationItemProperties.name),
  models: t.Optional(agentsRelationItemProperties.models),
});
const agents = t.Composite([
  agentsPlain,
  t.Object({ branches: t.Array(branches) }),
]);
const branchesExpandParam = t.Object({
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
      query: branchesExpandParam,
      response: { 200: t.Array(agents) },
    },
  )
  .post(
    "/",
    async ({ body, userId }) => {
      const agent = await createAgentRepo(userId!).create(
        body.name,
        body.defaultModel,
      );
      return status(201, agent);
    },
    {
      body: t.Composite([
        agentsInputCreate,
        t.Object({
          defaultModel: supportedModelsUnion,
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
      query: branchesExpandParam,
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
      query: branchesExpandParam,
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
