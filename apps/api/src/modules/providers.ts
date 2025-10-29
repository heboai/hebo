import { Elysia, status, t } from "elysia";

import { dbClient } from "@hebo/shared-api/middlewares/db-client";
import { ProviderConfig } from "@hebo/shared-data/types/provider-config";

import {
  providers,
  providersInputCreate,
} from "~api/generated/prismabox/providers";

export const providersModule = new Elysia({
  prefix: "/providers",
})
  .use(dbClient)
  .get(
    "/",
    async ({ dbClient }) => {
      return status(200, await dbClient.providers.findMany());
    },
    {
      response: { 200: t.Array(providers) },
    },
  )
  .post(
    "/",
    async ({ body, dbClient }) => {
      return status(
        201,
        await dbClient.providers.create({
          data: {
            name: body.name,
            config: body.config,
          } as any,
        }),
      );
    },
    {
      body: t.Object({
        name: providersInputCreate.properties.name,
        config: ProviderConfig,
      }),
      response: { 201: providers },
    },
  )
  .get(
    "/:providerName",
    async ({ dbClient, params }) => {
      return status(
        200,
        await dbClient.providers.findFirstOrThrow({
          where: { name: params.providerName },
        }),
      );
    },
    {
      params: t.Object({ providerName: t.String() }),
      response: { 200: providers },
    },
  )
  .delete(
    "/:providerName",
    async ({ dbClient, params }) => {
      return status(
        204,
        await dbClient.providers.delete({
          where: { name: params.providerName } as any,
        }),
      );
    },
    {
      params: t.Object({ providerName: t.String() }),
      response: { 204: t.Void() },
    },
  );
