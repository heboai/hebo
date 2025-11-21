import { Elysia, status, t } from "elysia";

import {
  Provider,
  ProviderConfig,
  ProviderNameEnum,
} from "@hebo/database/src/types/providers";
import { dbClient } from "@hebo/shared-api/middlewares/db-client";

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
      response: { 200: t.Array(Provider) },
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
      params: t.Object({ providerName: ProviderNameEnum }),
      response: { 200: Provider },
    },
  )
  .patch(
    "/:providerName",
    async ({ body, dbClient, params }) => {
      const { id } = await dbClient.providers.findFirstOrThrow({
        where: { name: params.providerName },
      });
      return status(
        200,
        await dbClient.providers.update({
          where: { id },
          data: body,
        }),
      );
    },
    {
      body: t.Object({
        config: ProviderConfig,
      }),
      params: t.Object({ providerName: ProviderNameEnum }),
      response: { 200: Provider },
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
