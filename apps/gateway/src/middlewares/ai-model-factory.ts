import { Elysia } from "elysia";

import { dbClient } from "@hebo/shared-api/middlewares/db-client";

import { getAiModelProviderConfig } from "./ai-models/ai-model-service";
import { createProvider } from "./ai-models/providers";

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
      const { providerName, customProviderConfig, modelId } =
        await getAiModelProviderConfig(dbClient, fullModelAlias);
      // FUTURE: memoize with TTL
      const provider = createProvider(providerName, customProviderConfig);
      // FUTURE: memoize (depends on provider config)
      const resolvedModelId = await provider.resolveModelId(modelId);
      const aiProvider = await provider.create();

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
