import { Elysia, status, t } from "elysia";

import { type Prisma } from "@hebo/database/src/generated/prisma/client";
import {
  agentsInputCreate,
  agentsInputUpdate,
  agentsPlain,
  agentsRelations,
} from "@hebo/database/src/generated/prismabox/agents";
import { createSlug } from "@hebo/database/src/utils/create-slug";
import { authService } from "@hebo/shared-api/middlewares/auth/auth-service";
import { dbClient } from "@hebo/shared-api/middlewares/db-client";

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
  .use(dbClient)
  .get(
    "/",
    async ({ dbClient, query }) => {
      return status(
        200,
        await dbClient.agents.findMany({
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
    async ({ body, dbClient }) => {
      return status(
        201,
        await dbClient.agents.create({
          data: {
            name: body.name,
            slug: createSlug(body.name, true),
            branches: {
              create: {
                name: "Main",
                slug: "main",
                models: [{ alias: "default", type: body.defaultModel }],
              },
            },
          } as any,
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
    async ({ dbClient, params, query }) => {
      return status(
        200,
        await dbClient.agents.findFirstOrThrow({
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
    async ({ body, dbClient, params, query }) => {
      return status(
        200,
        await dbClient.agents.update({
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
    async ({ dbClient, params }) => {
      await dbClient.agents.softDelete({ slug: params.agentSlug });
      return status(204);
    },
    {
      response: { 204: t.Void() },
    },
  );
