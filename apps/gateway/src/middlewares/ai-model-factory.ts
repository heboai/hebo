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
      fullModelAlias: string,
      modality: M,
    ): Promise<AiModelFor<M>> => {
      const { modelConfig, providerName, useCustomProvider } =
        await modelConfigService.resolve(fullModelAlias);

      // TODO: providers fallback following the supportedModels order (first I try bedrock, then groq, ...)
      const providerAdapter = await providerAdapterService.create(
        providerName,
        useCustomProvider,
      );

      const [provider, resolvedModelId] = await Promise.all([
        // FUTURE: memoize with TTL
        providerAdapter.provider,
        // FUTURE: memoize (depends on provider config)
        providerAdapter.resolveModelId(modelConfig),
      ]);

      if (modelConfig.modality !== modality)
        throw new BadRequestError(`Model is not a ${modality} model`);

      return modality === "chat"
        ? (provider.languageModel(resolvedModelId) as AiModelFor<M>)
        : (provider.textEmbeddingModel(resolvedModelId) as AiModelFor<M>);
    };

    return {
      aiModelFactory: createAIModel,
    };
  })
  .as("scoped");
