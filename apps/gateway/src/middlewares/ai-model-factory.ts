import { Elysia } from "elysia";

import type { createDbClient } from "@hebo/database/client";
import type {
  ProviderConfig,
  ProviderName,
} from "@hebo/database/src/types/providers";
import { dbClient } from "@hebo/shared-api/middlewares/db-client";
import supportedModels from "@hebo/shared-data/json/supported-models";
import type { Models } from "@hebo/shared-data/types/models";

import { createProvider } from "./providers";

import type { EmbeddingModel, LanguageModel } from "ai";

type ModelConfig = Models[number];

const toProviderModelId = (
  supportedModel: (typeof supportedModels)[number],
  providerName: ProviderName,
): string => {
  const entry = supportedModel.providers.find(
    (provider) => providerName in provider,
  ) as Record<ProviderName, string>;
  return entry[providerName];
};

const resolveProviderName = (
  supportedModel: (typeof supportedModels)[number],
): ProviderName => {
  // Currently, we just pick the first provider for a model, in future this will be more sophisticated
  const provider = supportedModel.providers[0];
  return Object.keys(provider)[0] as ProviderName;
};

const getModelConfig = async (
  dbClient: ReturnType<typeof createDbClient>,
  fullModelAlias: string,
): Promise<ModelConfig> => {
  const [agentSlug, branchSlug, modelAlias] = fullModelAlias.split("/");
  const branch = await dbClient.branches.findFirstOrThrow({
    where: { agent_slug: agentSlug, slug: branchSlug },
    select: { models: true },
  });
  const modelConfig = (branch.models as Models)?.find(
    (model) => model?.alias === modelAlias,
  );
  return modelConfig!;
};

const getAiModelProviderConfig = async (
  dbClient: ReturnType<typeof createDbClient>,
  alias: string,
) => {
  const customModelConfig = await getModelConfig(dbClient, alias);
  const commonModelConfig = supportedModels.find(
    (model) => model.name === customModelConfig.type,
  );
  const providerName = resolveProviderName(commonModelConfig!);
  const modelId = toProviderModelId(commonModelConfig!, providerName);

  let customProviderConfig: ProviderConfig | undefined;
  if (customModelConfig.customProvider) {
    const providerRecord = await dbClient.providers.getUnredacted(providerName);
    customProviderConfig = providerRecord.config as ProviderConfig;
  }

  return { providerName, customProviderConfig, modelId };
};

export const aiModelFactory = new Elysia({
  name: "ai-model-factory",
})
  .use(dbClient)
  .resolve(({ dbClient }) => {
    async function createModel(
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
        return (await createModel(fullModelAlias, "chat")) as LanguageModel;
      },
      embedding: async (
        fullModelAlias: string,
      ): Promise<EmbeddingModel<string>> => {
        return (await createModel(
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
