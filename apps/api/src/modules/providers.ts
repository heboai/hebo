import { Elysia, status, t } from "elysia";

import { dbClient } from "@hebo/shared-api/middlewares/db-client";
import {
  ProviderConfig,
  ProviderConfigConfig,
  ProviderNameEnum,
} from "@hebo/shared-data/types/provider-config";

import { providerConfigs as ProviderConfigResponse } from "~api/generated/prismabox/providerConfigs";

export const providersModule = new Elysia({
  prefix: "/providers",
})
  .use(dbClient)
  .get(
    "/",
    async ({ dbClient }) => {
      return status(200, await dbClient.providerConfigs.findMany());
    },
    {
      response: { 200: t.Array(ProviderConfigResponse) },
    },
  )
  .post(
    "/",
    async ({ body, dbClient }) => {
      return status(
        201,
        await dbClient.providerConfigs.create({
          data: {
            name: body.name,
            config: body.config,
          } as any,
        }),
      );
    },
    {
      body: ProviderConfig,
      response: { 201: ProviderConfigResponse },
    },
  )
  .get(
    "/:providerName",
    async ({ dbClient, params }) => {
      return status(
        200,
        await dbClient.providerConfigs.findFirstOrThrow({
          where: { name: params.providerName },
        }),
      );
    },
    {
      params: t.Object({ providerName: ProviderNameEnum }),
      response: { 200: ProviderConfigResponse },
    },
  )
  .patch(
    "/:providerName",
    async ({ body, dbClient, params }) => {
      const { id } = await dbClient.providerConfigs.findFirstOrThrow({
        where: { name: params.providerName },
      });
      return status(
        200,
        await dbClient.providerConfigs.update({
          where: { id },
          data: body,
        }),
      );
    },
    {
      body: t.Object({
        config: ProviderConfigConfig,
      }),
      params: t.Object({ providerName: ProviderNameEnum }),
      response: { 200: ProviderConfigResponse },
    },
  )
  .delete(
    "/:providerName",
    async ({ dbClient, params }) => {
      const { id } = await dbClient.providerConfigs.findFirstOrThrow({
        where: { name: params.providerName },
      });
      await dbClient.providerConfigs.softDelete({ id });
      return status(204);
    },
    {
      params: t.Object({ providerName: ProviderNameEnum }),
      response: { 204: t.Void() },
    },
  );
