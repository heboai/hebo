import { Elysia, status, t } from "elysia";

import { createSlug } from "@hebo/database/src/utils/create-slug";
import { dbClient } from "@hebo/shared-api/middlewares/db-client";
import { ModelsSchema } from "@hebo/shared-data/types/models";

import {
  branches,
  branchesInputCreate,
  branchesInputUpdate,
} from "~api/generated/prismabox/branches";

export const branchesModule = new Elysia({
  prefix: "/:agentSlug/branches",
})
  .use(dbClient)
  .get(
    "/",
    async ({ dbClient, params }) => {
      return status(
        200,
        await dbClient.branches.findMany({
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
    async ({ body, dbClient, params }) => {
      const { models } = await dbClient.branches.findFirstOrThrow({
        where: { agent_slug: params.agentSlug, slug: body.sourceBranchSlug },
      });
      return status(
        201,
        await dbClient.branches.create({
          data: {
            agent_slug: params.agentSlug,
            name: body.name,
            slug: createSlug(body.name),
            models,
          } as any,
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
    async ({ dbClient, params }) => {
      return status(
        200,
        await dbClient.branches.findFirstOrThrow({
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
    async ({ body, dbClient, params }) => {
      const { id } = await dbClient.branches.findFirstOrThrow({
        where: { agent_slug: params.agentSlug, slug: params.branchSlug },
      });
      return status(
        200,
        await dbClient.branches.update({
          where: { id },
          data: { name: body.name, models: body.models },
        }),
      );
    },
    {
      body: t.Object({
        name: branchesInputUpdate.properties.name,
        models: t.Optional(ModelsSchema),
      }),
      response: { 200: branches },
    },
  )
  .delete(
    "/:branchSlug",
    async ({ dbClient, params }) => {
      const { id } = await dbClient.branches.findFirstOrThrow({
        where: { agent_slug: params.agentSlug, slug: params.branchSlug },
      });
      await dbClient.branches.softDelete({ id });
      return status(204);
    },
    {
      response: { 204: t.Void() },
    },
  );
