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
  model: Models[number],
  db: ReturnType<typeof createDbClient>,
): Promise<ProviderConfig> => {
  const supported = supportedModels.find((m) => m.name === model.type);
  const defaultProviderName = supported?.providers?.length
    ? (Object.keys(supported.providers[0] ?? {})[0] as ProviderName)
    : undefined;
  const providerName = (model.customRouting ??
    defaultProviderName) as ProviderName;
  if (model.customRouting) {
    const { config } = await db.providers.getUnredacted(providerName);
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

const resolveModelId = async (
  modelType: string,
  providerCfg: ProviderConfig,
): Promise<string> => {
  const supported = supportedModels.find((m) => m.name === modelType);
  const modelId = (
    supported?.providers?.find((p) => providerCfg.name in p) as
      | Record<string, { id: string }>
      | undefined
  )?.[providerCfg.name]?.id as string;
  const adapter = ADAPTERS[providerCfg.name];
  if (!adapter) return modelId;
  // For bedrock we need to upgrade to inference profile ARN; others are passthrough
  return adapter.transformModelId(modelId, providerCfg.config);
};

export const getModelObject = async (
  dbClient: ReturnType<typeof createDbClient>,
  modelString: string,
) => {
  const [agentSlug, branchSlug, modelAlias] = modelString.split("/");
  const result = await dbClient.branches.findFirstOrThrow({
    where: { agent_slug: agentSlug, slug: branchSlug },
    select: { models: true },
  });
  const foundModel = (result.models as Models)?.find(
    (m) => m?.alias === modelAlias,
  );
  if (!foundModel) throw new ModelNotFoundError();
  return foundModel;
};

export function pickModel(
  model: Models[number],
  providerCfg: ProviderConfig,
  expect: "chat",
): Promise<LanguageModel>;
export function pickModel(
  model: Models[number],
  providerCfg: ProviderConfig,
  expect: "embedding",
): Promise<EmbeddingModel<string>>;
export async function pickModel(
  model: Models[number],
  providerCfg: ProviderConfig,
  expect: "chat" | "embedding",
) {
  const modality = getModalityOrThrow(model.type);
  if (modality !== expect)
    throw new BadRequestError(
      `Model '${model.type}' is a ${modality} model`,
      "model_mismatch",
    );
  const modelId = await resolveModelId(model.type, providerCfg);
  const provider = await getOrCreateProvider(providerCfg);
  return expect === "chat"
    ? provider.languageModel(modelId)
    : provider.textEmbeddingModel(modelId);
}
