import type { createDbClient } from "@hebo/database/client";
import type {
  ProviderConfig,
  ProviderName,
} from "@hebo/database/src/types/providers";
import supportedModels from "@hebo/shared-data/json/supported-models";
import type { Models } from "@hebo/shared-data/types/models";

type ModelConfig = Models[number];

const getModelIdForProvider = (
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

export const getAiModelProviderConfig = async (
  dbClient: ReturnType<typeof createDbClient>,
  alias: string,
) => {
  const customModelConfig = await getModelConfig(dbClient, alias);
  const commonModelConfig = supportedModels.find(
    (m) => m.name === customModelConfig.type,
  );
  const providerName = resolveProviderName(commonModelConfig!);
  const modelId = getModelIdForProvider(commonModelConfig!, providerName);

  let customProviderConfig: ProviderConfig | undefined;
  if (customModelConfig.customProvider) {
    const customerProviderConfig =
      await dbClient.providers.getUnredacted(providerName);
    customProviderConfig = customerProviderConfig.config as ProviderConfig;
  }

  return { providerName, customProviderConfig, modelId };
};
