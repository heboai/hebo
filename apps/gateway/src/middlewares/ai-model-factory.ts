import { Elysia } from "elysia";

import { dbClient } from "@hebo/shared-api/middlewares/db-client";

import { getAiModelProviderConfig } from "./ai-models/ai-model-service";
import { resolveProvider } from "./ai-models/provider-service";

import type { EmbeddingModel, LanguageModel } from "ai";

export const modelFactory = new Elysia({
  name: "model-factory",
})
  .use(dbClient)
  .resolve(({ dbClient }) => {
    async function createAIModelOrThrow({
      fullModelAlias,
      modality,
    }: {
      fullModelAlias: string;
      modality: "chat";
    }): Promise<LanguageModel>;
    async function createAIModelOrThrow({
      fullModelAlias,
      modality,
    }: {
      fullModelAlias: string;
      modality: "embedding";
    }): Promise<EmbeddingModel<string>>;
    async function createAIModelOrThrow({
      fullModelAlias,
      modality,
    }: {
      fullModelAlias: string;
      modality: "chat" | "embedding";
    }): Promise<LanguageModel | EmbeddingModel<string>> {
      const { providerName, providerConfig, modelType } =
        await getAiModelProviderConfig(dbClient, fullModelAlias, modality);
      const provider = resolveProvider(providerName);
      const modelId = await provider.transformModelId(
        modelType,
        providerConfig,
      );
      const aiProvider = await provider.create(providerConfig);

      return modality === "chat"
        ? aiProvider.languageModel(modelId)
        : aiProvider.textEmbeddingModel(modelId);
    }

    return {
      modelFactory: {
        createAIModelOrThrow,
      },
    };
  })
  .as("scoped");
