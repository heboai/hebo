import Elysia from "elysia";

import { dbClient } from "@hebo/shared-api/middlewares/db-client";

import {
  getModelObject,
  getProviderConfig,
  pickChat,
  pickEmbedding,
} from "./service";

export const provider = new Elysia({ name: "provider" })
  .use(dbClient)
  .resolve(({ dbClient }) => ({
    provider: {
      async chat(model_alias: string) {
        const model = await getModelObject(dbClient, model_alias);
        const providerCfg = await getProviderConfig(model, dbClient);
        return pickChat(model, providerCfg);
      },
      async embedding(model_alias: string) {
        const model = await getModelObject(dbClient, model_alias);
        const providerCfg = await getProviderConfig(model, dbClient);
        return pickEmbedding(model, providerCfg);
      },
    },
  }))
  .as("scoped");
