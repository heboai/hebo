import { Elysia } from "elysia";

import { dbClient } from "@hebo/shared-api/middlewares/db-client";

import { ModelConfigService } from "./model-config";
import { ProviderAdapterService } from "./providers";

import type { EmbeddingModel, LanguageModel } from "ai";

export const aiModelFactory = new Elysia({
  name: "ai-model-factory",
})
  .use(dbClient)
  .resolve(({ dbClient }) => {
    const modelConfigService = new ModelConfigService(dbClient);
    const providerAdapterService = new ProviderAdapterService(dbClient);

    const createBaseAiModel = async (
      fullModelAlias: string,
      modality: "chat" | "embedding",
    ) => {
      const { modelConfig, providerName, customProvider } =
        await modelConfigService.resolve(fullModelAlias);
      const providerAdapter = await providerAdapterService.create(
        providerName,
        Boolean(customProvider),
      );
      const [provider, resolvedModelId] = await Promise.all([
        // FUTURE: memoize with TTL
        providerAdapter.provider,
        // FUTURE: memoize (depends on provider config)
        providerAdapter.resolveModelId(modelConfig),
      ]);

      return modality === "chat"
        ? provider.languageModel(resolvedModelId)
        : provider.textEmbeddingModel(resolvedModelId);
    };

    const createAIModel = {
      chat: async (fullModelAlias: string) => {
        return (await createBaseAiModel(
          fullModelAlias,
          "chat",
        )) as LanguageModel;
      },
      embedding: async (fullModelAlias: string) => {
        return (await createBaseAiModel(
          fullModelAlias,
          "embedding",
        )) as EmbeddingModel<string>;
      },
    } as const;

    return {
      aiModelFactory: createAIModel,
    };
  })
  .as("scoped");
