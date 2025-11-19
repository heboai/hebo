import type { createDbClient } from "@hebo/database/client";
import supportedModels from "@hebo/shared-data/json/supported-models";
import type { Models } from "@hebo/shared-data/types/models";
import type {
  ProviderConfig,
  ProviderName,
} from "@hebo/shared-data/types/providers";

import { BadRequestError, ModelNotFoundError } from "./errors";

type ModelConfig = Models[number];

export const SUPPORTED_MODELS = supportedModels.map((m) => m.name).sort();

const getModelIdForProvider = (
  supportedModel: ReturnType<typeof getSupportedModelOrThrow>,
  providerName: ProviderName,
): string => {
  const entry = supportedModel.providers.find(
    (provider) => providerName in provider,
  ) as Record<ProviderName, string>;
  return entry[providerName];
};

const resolveProviderName = (
  supportedModel: ReturnType<typeof getSupportedModelOrThrow>,
): ProviderName => {
  // Currently, we just pick the first provider for a model, in future this will be more sophisticated
  const provider = supportedModel.providers[0];
  return Object.keys(provider)[0] as ProviderName;
};

export const getSupportedModelOrThrow = (
  type: string,
  modality?: "chat" | "embedding" | undefined,
) => {
  const model = supportedModels.find((m) => m.name === type);
  if (!model)
    throw new BadRequestError(
      `Unknown or unsupported model '${type}'`,
      "model_unsupported",
    );
  if (modality && model.modality !== modality)
    throw new BadRequestError(
      `Model '${type}' is a ${model.modality} model, not a ${modality} model`,
      "model_mismatch",
    );
  return model;
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
  const supportedModel = getSupportedModelOrThrow(model.type, modality);
  const providerName = resolveProviderName(supportedModel);
  const modelId = getModelIdForProvider(supportedModel, providerName);

  let providerConfig: ProviderConfig | undefined;
  if (model.customProvider) {
    const provider = await dbClient.providers.getUnredacted(providerName);
    providerConfig = provider.config as ProviderConfig;
  }

  return { providerName, providerConfig, modelId };
};
