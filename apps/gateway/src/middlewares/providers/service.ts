import { createGroq } from "@ai-sdk/groq";
import { createVoyage } from "voyage-ai-provider";

import type { createDbClient } from "@hebo/database/client";
import { getSecret } from "@hebo/shared-api/utils/get-env";
import supportedModels from "@hebo/shared-data/json/supported-models";
import type { Models } from "@hebo/shared-data/types/models";
import type {
  AwsProviderConfig,
  Provider as ProviderConfig,
  ProviderName,
} from "@hebo/shared-data/types/providers";

import { getModalityOrThrow } from "~gateway/utils/model-support";

import {
  createBedrockProvider,
  getBedrockDefaultConfig,
  transformBedrockModelId,
} from "./bedrock";
import { BadRequestError, ModelNotFoundError } from "./errors";
import { createVertexProvider, getVertexDefaultConfig } from "./vertex";

import type { LanguageModel, Provider, EmbeddingModel } from "ai";

type ModelConfig = Models[number];

type ProviderAdapter = {
  getDefaultConfig: () => Promise<any>;
  create: (config: any) => Promise<Provider>;
  transformModelId: (id: string, config?: any) => Promise<string>;
};

const ADAPTERS: Record<ProviderName, ProviderAdapter> = {
  bedrock: {
    getDefaultConfig: getBedrockDefaultConfig,
    create: (config: any) => createBedrockProvider(config as AwsProviderConfig),
    transformModelId: (id: string, cfg?: any) =>
      transformBedrockModelId(id, cfg),
  },
  vertex: {
    getDefaultConfig: getVertexDefaultConfig,
    create: (config: any) => createVertexProvider(config),
    transformModelId: async (id: string) => id,
  },
  groq: {
    getDefaultConfig: async () => ({ apiKey: await getSecret("GroqApiKey") }),
    create: async (config: any) => createGroq({ ...config }),
    transformModelId: async (id: string) => id,
  },
  voyage: {
    getDefaultConfig: async () => ({
      apiKey: await getSecret("VoyageApiKey"),
    }),
    create: async (config: any) => createVoyage({ ...config }),
    transformModelId: async (id: string) => id,
  },
};

const resolveProviderName = (modelConfig: ModelConfig): ProviderName => {
  if (modelConfig.customRouting) {
    return modelConfig.customRouting as ProviderName;
  }

  const supportedModel = supportedModels.find(
    (model) => model.name === modelConfig.type,
  );
  // Curently, we just pick the first provider for a model
  const providerEntry = supportedModel?.providers?.[0];
  return Object.keys(providerEntry!)[0] as ProviderName;
};

const createProvider = async (cfg: ProviderConfig): Promise<Provider> => {
  const adapter = ADAPTERS[cfg.name];
  if (!adapter)
    throw new BadRequestError(
      `Unknown or unsupported provider '${cfg.name}'`,
      "provider_unsupported",
    );
  return adapter.create(cfg.config);
};

export const getProviderConfig = async (
  dbClient: ReturnType<typeof createDbClient>,
  modelConfig: ModelConfig,
): Promise<ProviderConfig> => {
  const providerName = resolveProviderName(modelConfig);

  if (modelConfig.customRouting) {
    const { config } = await dbClient.providers.getUnredacted(providerName);
    return { name: providerName, config } as ProviderConfig;
  }
  const adapter = ADAPTERS[providerName];
  const config = await adapter.getDefaultConfig();
  return { name: providerName, config } as ProviderConfig;
};

// FUTURE: Use a more sophisticated cache mechanism
const providerInstances = new Map<string, Provider>();
const getOrCreateProvider = async (cfg: ProviderConfig): Promise<Provider> => {
  const key = `${cfg.name}:${JSON.stringify(cfg.config)}`;
  const cached = providerInstances.get(key);
  if (cached) return cached;
  const instance = await createProvider(cfg);
  providerInstances.set(key, instance);
  return instance;
};

const getModelIdForProvider = (
  modelType: string,
  providerName: ProviderName,
): string => {
  const supportedModel = supportedModels.find((m) => m.name === modelType)!;
  const entry = supportedModel.providers!.find(
    (provider) => providerName in provider,
  ) as Record<ProviderName, string>;
  return entry[providerName];
};

const resolveModelId = async (
  modelType: string,
  providerCfg: ProviderConfig,
): Promise<string> => {
  const modelId = getModelIdForProvider(modelType, providerCfg.name);
  const adapter = ADAPTERS[providerCfg.name];
  // For bedrock we need to upgrade to inference profile ARN; others are passthrough
  return adapter.transformModelId(modelId, providerCfg.config);
};

export const getModelConfig = async (
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

export function createAIModel(
  modelConfig: ModelConfig,
  providerCfg: ProviderConfig,
  expect: "chat",
): Promise<LanguageModel>;
export function createAIModel(
  modelConfig: ModelConfig,
  providerCfg: ProviderConfig,
  expect: "embedding",
): Promise<EmbeddingModel<string>>;
export async function createAIModel(
  modelConfig: ModelConfig,
  providerCfg: ProviderConfig,
  expect: "chat" | "embedding",
) {
  const modality = getModalityOrThrow(modelConfig.type);
  if (modality !== expect)
    throw new BadRequestError(
      `Model '${modelConfig.type}' is a ${modality} model`,
      "model_mismatch",
    );
  const provider = await getOrCreateProvider(providerCfg);
  const modelId = await resolveModelId(modelConfig.type, providerCfg);
  return expect === "chat"
    ? provider.languageModel(modelId)
    : provider.textEmbeddingModel(modelId);
}
