import { Elysia, status, t } from "elysia";

import { prismaExtended } from "@hebo/database/prisma-config";
import { type Prisma } from "@hebo/database/src/generated/prisma/client";
import {
  agentsInputCreate,
  agentsInputUpdate,
  agentsPlain,
  agentsRelations,
} from "@hebo/database/src/generated/prismabox/agents";
import { createSlug } from "@hebo/database/src/utils/create-slug";
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

const agentInclude = (withBranches = false): Prisma.agentsInclude =>
  withBranches ? { branches: true } : { branches: { select: { slug: true } } };

export const agentsModule = new Elysia({
  prefix: "/agents",
})
  .use(authService)
  .derive(({ userId }) => ({ client: prismaExtended(userId!) }))
  .get(
    "/",
    async ({ client, query }) => {
      return status(
        200,
        await client.agents.findMany({
          where: {},
          include: agentInclude(query.expand === "branches"),
        }),
      );
    },
    {
      query: branchesExpandParam,
      response: { 200: t.Array(agents) },
    },
  )
  .post(
    "/",
    async ({ body, client, userId }) => {
      return status(
        201,
        await client.agents.create({
          data: {
            name: body.name,
            slug: createSlug(body.name, true),
            created_by: userId!,
            updated_by: userId!,
            branches: {
              create: {
                name: "Main",
                slug: "main",
                created_by: userId!,
                updated_by: userId!,
                models: [{ alias: "default", type: body.defaultModel }],
              },
            },
          },
          include: agentInclude(true),
        }),
      );
    },
    {
      body: t.Object({
        ...agentsInputCreate.properties,
        defaultModel: supportedModelsUnion,
      }),
      response: { 201: agents },
    },
  )
  .get(
    "/:agentSlug",
    async ({ client, params, query }) => {
      return status(
        200,
        await client.agents.findFirstOrThrow({
          where: { slug: params.agentSlug },
          include: agentInclude(query.expand === "branches"),
        }),
      );
    },
    {
      query: branchesExpandParam,
      response: { 200: agents },
    },
  )
  .patch(
    "/:agentSlug",
    async ({ body, client, params, query }) => {
      return status(
        200,
        await client.agents.update({
          where: { slug: params.agentSlug },
          data: { name: body.name },
          include: agentInclude(query.expand === "branches"),
        }),
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
    async ({ client, params, userId }) => {
      await client.agents.update({
        where: { slug: params.agentSlug },
        data: { deleted_by: userId!, deleted_at: new Date() },
      });
      return status(204);
    },
    {
      response: { 204: t.Void() },
    },
  );
