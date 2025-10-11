import { Elysia, status, t } from "elysia";

import { prismaExtension } from "@hebo/database/prisma-extension";
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

const agents = t.Object({
  ...agentsPlain.properties,
  branches: t.Array(t.Partial(agentsRelations.properties.branches.items)),
});
const branchesExpandParam = t.Object({
  expand: t.Optional(t.Literal("branches")),
});

const agentInclude = (withBranches = false): Prisma.agentsInclude =>
  withBranches ? { branches: true } : { branches: { select: { slug: true } } };

export const agentsModule = new Elysia({
  prefix: "/agents",
})
  .use(authService)
  .resolve(({ userId }) => ({ client: prismaExtension(userId!) }))
  .get(
    "/",
    async ({ client, query }) => {
      return status(
        200,
        await client.agents.findMany({
          // This is deliberately left blank to apply the audit filters
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
    async ({ client, params }) => {
      await client.agents.softDelete({ slug: params.agentSlug });
      return status(204);
    },
    {
      response: { 204: t.Void() },
    },
  );
