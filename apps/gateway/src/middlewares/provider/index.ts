import Elysia from "elysia";

import { dbClient } from "@hebo/shared-api/middlewares/db-client";

import { getModelObject, getProviderConfig, pickModel } from "./service";

export const provider = new Elysia({ name: "provider" })
  .use(dbClient)
  .resolve(({ dbClient }) => ({
    provider: {
      chat: (alias: string) =>
        getModelObject(dbClient, alias).then(async (model) =>
          pickModel(model, await getProviderConfig(model, dbClient), "chat"),
        ),

      embedding: (alias: string) =>
        getModelObject(dbClient, alias).then(async (model) =>
          pickModel(
            model,
            await getProviderConfig(model, dbClient),
            "embedding",
          ),
        ),
    },
  }))
  .as("scoped");
