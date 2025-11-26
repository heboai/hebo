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
import { type Models } from "@hebo/shared-data/types/models";

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

      const newProvider = await dbClient.providers.create({
        data: {
          slug: params.providerSlug,
          config: body,
        } as any,
      });

      if (existing) {
        await dbClient.providers.softDelete({ id: existing.id });
      }

      return status(201, newProvider);
    },
    {
      body: ProviderConfig,
      params: t.Object({ providerSlug: ProviderSlugEnum }),
      response: { 200: Provider, 201: Provider },
    },
  )
  .delete(
    "/:providerSlug/config",
    async ({ dbClient, params }) => {
      const existing = await dbClient.providers.findFirst({
        where: { slug: params.providerSlug },
        select: { id: true },
      });

      if (existing) {
        const branches = await dbClient.branches.findMany();

        const affectedBranches = branches.filter((branch) => {
          const models = branch.models as Models;
          return models.some((model) =>
            model.routing?.only?.includes(params.providerSlug),
          );
        });

        // Batch update all affected branches + delete provider in a single transaction
        await dbClient.$transaction([
          ...affectedBranches.map((branch) => {
            const models = branch.models as Models;
            return dbClient.branches.update({
              where: { id: branch.id },
              data: {
                models: models.map((model) =>
                  model.routing?.only?.includes(params.providerSlug)
                    ? { ...model, routing: undefined }
                    : model,
                ),
              },
            });
          }),
          dbClient.providers.update({
            where: { id: existing.id },
            data: { deleted_at: new Date() },
          }),
        ]);
      }

      return status(204);
    },
    {
      params: t.Object({ providerSlug: ProviderSlugEnum }),
      response: { 204: t.Void() },
    },
  );
