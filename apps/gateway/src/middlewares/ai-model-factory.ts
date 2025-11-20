import { Elysia } from "elysia";

import { dbClient } from "@hebo/shared-api/middlewares/db-client";

import { getAiModelProviderConfig } from "./ai-models/ai-model-service";
import { createProvider } from "./ai-models/provider-service";

import type { EmbeddingModel, LanguageModel } from "ai";

export const modelFactory = new Elysia({
  name: "model-factory",
})
  .use(dbClient)
  .resolve(({ dbClient }) => {
    async function createBaseModel(
      fullModelAlias: string,
      modality: "chat" | "embedding",
    ): Promise<LanguageModel | EmbeddingModel<string>> {
      const { providerName, providerConfig, modelId } =
        await getAiModelProviderConfig(dbClient, fullModelAlias, modality);
      const provider = createProvider(providerName);
      const resolvedProviderConfig =
        await provider.resolveConfig(providerConfig);
      const resolvedModelId = await provider.resolveModelId(
        modelId,
        resolvedProviderConfig,
      );
      const aiProvider = await provider.create(resolvedProviderConfig);

      return modality === "chat"
        ? aiProvider.languageModel(resolvedModelId)
        : aiProvider.textEmbeddingModel(resolvedModelId);
    }

    const createAIModel = {
      chat: async (fullModelAlias: string): Promise<LanguageModel> => {
        const model = await createBaseModel(fullModelAlias, "chat");
        return model as LanguageModel;
      },
      embedding: async (
        fullModelAlias: string,
      ): Promise<EmbeddingModel<string>> => {
        const model = await createBaseModel(fullModelAlias, "embedding");
        return model as EmbeddingModel<string>;
      },
    } as const;

    return {
      modelFactory: createAIModel,
    };
  })
  .as("scoped");
