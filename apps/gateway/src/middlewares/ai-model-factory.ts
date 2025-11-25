import { Elysia } from "elysia";

import { dbClient } from "@hebo/shared-api/middlewares/db-client";

import { ModelConfigService } from "./model-config";
import { ProviderAdapterService } from "./providers";
import { BadRequestError } from "./providers/errors";

import type { EmbeddingModel, LanguageModel } from "ai";

type Modality = "chat" | "embedding";

type AiModelFor<M extends Modality> = M extends "chat"
  ? LanguageModel
  : EmbeddingModel<string>;

export const aiModelFactory = new Elysia({
  name: "ai-model-factory",
})
  .use(dbClient)
  .resolve(({ dbClient }) => {
    const modelConfigService = new ModelConfigService(dbClient);
    const providerAdapterService = new ProviderAdapterService(dbClient);

    const createAIModel = async <M extends Modality>(
      modelAliasPath: string,
      modality: M,
    ): Promise<AiModelFor<M>> => {
      // FUTURE: memoize with TTL
      const { modelConfig, customProviderName } =
        await modelConfigService.resolve(modelAliasPath);

      if (modelConfig.modality !== modality)
        throw new BadRequestError(
          `Model ${modelAliasPath} is not a ${modality} model.`,
        );

      // FUTURE: memoize with TTL
      const { provider, modelId } = await providerAdapterService.resolve(
        modelConfig,
        customProviderName,
      );

      return modality === "chat"
        ? (provider.languageModel(modelId) as AiModelFor<M>)
        : (provider.textEmbeddingModel(modelId) as AiModelFor<M>);
    };

    return {
      aiModelFactory: createAIModel,
    };
  })
  .as("scoped");
