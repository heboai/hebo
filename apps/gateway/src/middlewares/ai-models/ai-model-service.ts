import type { createDbClient } from "@hebo/database/client";
import type { Models } from "@hebo/shared-data/types/models";
import type {
  ProviderConfig,
  ProviderName,
} from "@hebo/shared-data/types/providers";

import { getSupportedModelOrThrow } from "~gateway/utils/supported-models";

import { ModelNotFoundError } from "../../utils/errors";

type ModelConfig = Models[number];

const resolveProviderName = (
  modelConfig: ModelConfig,
  modality: "chat" | "embedding",
): ProviderName => {
  // Currently, we just pick the first provider for a model, in future this will be more sophisticated
  const supportedProvider = getSupportedModelOrThrow(modelConfig.type, modality)
    .providers[0];
  return Object.keys(supportedProvider)[0] as ProviderName;
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
  if (!modelConfig) throw new ModelNotFoundError();
  return modelConfig;
};

export const getAiModelProviderConfig = async (
  dbClient: ReturnType<typeof createDbClient>,
  alias: string,
  modality: "chat" | "embedding",
) => {
  const model = await getModelConfig(dbClient, alias);
  const providerName = resolveProviderName(model, modality);
  let providerConfig: ProviderConfig | undefined;

  if (model.customProvider) {
    const provider = await dbClient.providers.getUnredacted(providerName);
    providerConfig = provider.config as ProviderConfig;
  }

  return { providerName, providerConfig, modelType: model.type };
};
