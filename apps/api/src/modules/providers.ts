import { Elysia, status, t } from "elysia";

import {
  Provider,
  type ProviderName,
  ProviderNameEnum,
  ProvidersWithDisplayName,
  supportedProviders,
} from "@hebo/database/src/types/providers";
import { dbClient } from "@hebo/shared-api/middlewares/db-client";

export const providersModule = new Elysia({
  prefix: "/providers",
})
  .use(dbClient)
  .get(
    "/",
    async ({ dbClient }) => {
      const configuredProviders = await dbClient.providers.findMany();

      const providers = Object.entries(supportedProviders).map(
        ([name, { displayName }]) => ({
          name: name as ProviderName,
          displayName,
          config: configuredProviders.find((p) => p.name === name)?.config,
        }),
      );

      return status(200, providers);
    },
    {
      response: { 200: ProvidersWithDisplayName },
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
      body: Provider,
      response: { 201: Provider },
    },
  )
  .delete(
    "/:providerName",
    async ({ dbClient, params }) => {
      const { id } = await dbClient.providers.findFirstOrThrow({
        where: { name: params.providerName },
      });
      await dbClient.providers.softDelete({ id });
      return status(204);
    },
    {
      params: t.Object({ providerName: ProviderNameEnum }),
      response: { 204: t.Void() },
    },
  );
