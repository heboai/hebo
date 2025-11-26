import { Elysia, status, t } from "elysia";

import {
  Provider,
  ProviderConfig,
  type ProviderSlug,
  ProviderSlugEnum,
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
        ([slug, { name }]) => ({
          slug: slug as ProviderSlug,
          name,
          config: configuredProviders.find((p) => p.slug === slug)?.config,
        }),
      );

      return status(200, providers);
    },
    {
      response: { 200: ProvidersWithDisplayName },
    },
  )
  .put(
    "/:providerSlug/config",
    async ({ body, dbClient, params }) => {
      const existing = await dbClient.providers.findFirst({
        where: { slug: params.providerSlug },
        select: { id: true },
      });

      if (existing) {
        return status(
          200,
          await dbClient.providers.update({
            where: { id: existing.id },
            data: { config: body },
          }),
        );
      }

      return status(
        201,
        await dbClient.providers.create({
          data: {
            slug: params.providerSlug,
            config: body,
          } as any,
        }),
      );
    },
    {
      body: ProviderConfig,
      params: t.Object({ providerSlug: ProviderSlugEnum }),
      response: { 200: Provider, 201: Provider },
    },
  )
  .delete(
    "/:providerSlug",
    async ({ dbClient, params }) => {
      const { id } = await dbClient.providers.findFirstOrThrow({
        where: { slug: params.providerSlug },
      });
      await dbClient.providers.softDelete({ id });
      return status(204);
    },
    {
      params: t.Object({ providerSlug: ProviderSlugEnum }),
      response: { 204: t.Void() },
    },
  );
