import { Elysia } from "elysia";

import { dbClient } from "@hebo/shared-api/middlewares/db-client";

import { ModelConfigService } from "./model-config";
import { ProviderAdapterFactory } from "./providers";
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
    const providerAdapterFactory = new ProviderAdapterFactory(dbClient);

    const createAIModel = async <M extends Modality>(
      modelAliasPath: string,
      modality: M,
    ): Promise<AiModelFor<M>> => {
      // FUTURE: Cache this
      const { modelConfig, customProviderName } =
        await modelConfigService.resolve(modelAliasPath);

      if (modelConfig.modality !== modality)
        throw new BadRequestError(
          `Model ${modelAliasPath} (${modelConfig.name}) is not a ${modality} model.`,
        );

      // FUTURE: Cache this
      const { provider, modelId } = await providerAdapterFactory.create(
        modelConfig,
        customProviderName,
      );

      return modality === "chat"
        ? (provider.languageModel(modelId) as AiModelFor<M>)
        : (provider.textEmbeddingModel(modelId) as AiModelFor<M>);
    };

    return {
      aiModelFactory: {
        create: createAIModel,
      },
    };
  })
  .as("scoped");
