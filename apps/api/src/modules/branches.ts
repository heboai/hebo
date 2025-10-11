import { Elysia, status, t } from "elysia";

import { prismaExtension } from "@hebo/database/prisma-extension";
import { type Prisma } from "@hebo/database/src/generated/prisma/client";
import {
  branches,
  branchesInputCreate,
  branchesInputUpdate,
} from "@hebo/database/src/generated/prismabox/branches";
import { createSlug } from "@hebo/database/src/utils/create-slug";
import { authService } from "@hebo/shared-api/auth/auth-service";
import supportedModels from "@hebo/shared-data/json/supported-models";

export const supportedModelsUnion = t.Union(
  supportedModels.map(({ name }) => t.Literal(name)),
  {
    error() {
      return "Invalid model name";
    },
  },
);

// undefined and [] are both valid for models update
const modelsUpdate = t.Optional(
  t.Array(
    t.Optional(
      t.Object({
        alias: t.String(),
        type: supportedModelsUnion,
        endpoint: t.Optional(
          t.Object({
            baseUrl: t.String(),
            apiKey: t.String(),
          }),
        ),
      }),
    ),
  ),
);

export const branchesModule = new Elysia({
  prefix: "/:agentSlug/branches",
})
  .use(authService)
  .resolve(({ userId }) => ({ client: prismaExtension(userId!) }))
  .get(
    "/",
    async ({ client, params }) => {
      return status(
        200,
        await client.branches.findMany({
          where: { agent_slug: params.agentSlug },
        }),
      );
    },
    {
      response: { 200: t.Array(branches) },
    },
  )
  .post(
    "/",
    async ({ body, client, params, userId }) => {
      const { models } = await client.branches.findFirstOrThrow({
        where: { agent_slug: params.agentSlug, slug: body.sourceBranchSlug },
      });
      return status(
        201,
        await client.branches.create({
          data: {
            agent_slug: params.agentSlug,
            name: body.name,
            slug: createSlug(body.name),
            // Cast to InputJsonValue because Prisma reads JSON arrays as JsonValue[]
            models: models as Prisma.InputJsonValue[],
            created_by: userId!,
            updated_by: userId!,
          },
        }),
      );
    },
    {
      body: t.Object({
        name: branchesInputCreate.properties.name,
        sourceBranchSlug: t.String(),
      }),
      response: { 201: branches },
    },
  )
  .get(
    "/:branchSlug",
    async ({ client, params }) => {
      return status(
        200,
        await client.branches.findFirstOrThrow({
          where: { agent_slug: params.agentSlug, slug: params.branchSlug },
        }),
      );
    },
    {
      response: { 200: branches },
    },
  )
  .patch(
    "/:branchSlug",
    async ({ body, client, params }) => {
      const { id } = await client.branches.findFirstOrThrow({
        where: { agent_slug: params.agentSlug, slug: params.branchSlug },
      });
      return status(
        200,
        await client.branches.update({
          where: { id },
          data: {
            name: body.name,
            // Cast to InputJsonValue because Prisma reads JSON arrays as JsonValue[]
            models: body.models as Prisma.InputJsonValue[] | undefined,
          },
        }),
      );
    },
    {
      body: t.Object({
        name: branchesInputUpdate.properties.name,
        models: modelsUpdate,
      }),
      response: { 200: branches },
    },
  )
  .delete(
    "/:branchSlug",
    async ({ client, params }) => {
      const { id } = await client.branches.findFirstOrThrow({
        where: { agent_slug: params.agentSlug, slug: params.branchSlug },
      });
      await client.branches.softDelete({ id });
      return status(204);
    },
    {
      response: { 204: t.Void() },
    },
  );
