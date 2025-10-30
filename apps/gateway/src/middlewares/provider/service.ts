import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
import { createVertex } from "@ai-sdk/google-vertex";
import { createVoyage } from "voyage-ai-provider";

import type { createDbClient } from "@hebo/database/client";
import { getEnvValue } from "@hebo/shared-api/utils/get-env";
import supportedModels from "@hebo/shared-data/json/supported-models";
import type { Models } from "@hebo/shared-data/types/models";
import type {
  AwsProviderConfig,
  GoogleProviderConfig,
  ProviderConfig,
  ProviderName,
} from "@hebo/shared-data/types/provider-config";

import type { LanguageModel, Provider, EmbeddingModel } from "ai";

export const SUPPORTED_MODELS = supportedModels.map((m) => m.name).sort();

const DEFAULTS_BY_PROVIDER: Record<ProviderName, ProviderConfig> = {
  bedrock: {
    name: "bedrock",
    config: {
      accessKeyId: await getEnvValue("AWSAccessKeyId"),
      secretAccessKey: await getEnvValue("AWSSecretAccessKey"),
      inferenceProfile: await getEnvValue("BedrockInferenceProfile"),
      region: "us-east-1",
    },
  },
  vertex: {
    name: "vertex",
    config: {
      serviceAccount: JSON.parse(
        await getEnvValue("GoogleVertexServiceAccount"),
      ),
      location: "us-central1",
      project: await getEnvValue("GoogleVertexProject"),
    },
  },
  voyage: {
    name: "voyage",
    config: {
      apiKey: await getEnvValue("VoyageApiKey"),
    },
  },
};

export class BadRequestError extends Error {
  status: number;
  type: string;
  code: string;
  constructor(message: string, code = "model_mismatch") {
    super(message);
    this.name = "BadRequestError";
    this.status = 400;
    this.type = "invalid_request_error";
    this.code = code;
  }
}

export class ModelNotFoundError extends Error {}

export const supportedOrThrow = (type: string) => {
  if (!SUPPORTED_MODELS.includes(type)) {
    throw new BadRequestError(
      `Unknown or unsupported model '${type}'`,
      "model_unsupported",
    );
  }
};

const createProvider = async (cfg: ProviderConfig): Promise<Provider> => {
  const { name, config } = cfg;
  switch (name) {
    case "bedrock": {
      return createAmazonBedrock({ ...config });
    }
    case "vertex": {
      const { serviceAccount, location, project, baseURL } =
        config as GoogleProviderConfig;
      return createVertex({
        googleAuthOptions: { credentials: serviceAccount },
        location,
        project,
        baseURL,
      });
    }
    case "voyage": {
      return createVoyage({ ...config });
    }
    default: {
      throw new BadRequestError(
        `Unknown or unsupported provider '${name}'`,
        "provider_unsupported",
      );
    }
  }
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
    const { config } = await db.providerConfigs.getUnredacted(providerName);
    return { name: providerName, config } as ProviderConfig;
  }
  return DEFAULTS_BY_PROVIDER[providerName];
};

const providerInstances = new Map<string, Provider>();
const getOrCreateProvider = async (cfg: ProviderConfig): Promise<Provider> => {
  const key = `${cfg.name}:${JSON.stringify(cfg.config)}`;
  if (providerInstances.has(key)) {
    return providerInstances.get(key)!;
  }
  const instance = await createProvider(cfg);
  providerInstances.set(key, instance);
  return instance;
};

const resolveModelId = (
  modelType: string,
  providerCfg: ProviderConfig,
): string => {
  const supported = supportedModels.find((m) => m.name === modelType);
  const providerEntry = supported?.providers?.find(
    (p) => providerCfg.name in p,
  ) as Record<string, { id: string }>;
  let modelId = providerEntry[providerCfg.name]?.id;
  if (
    providerCfg.name === "bedrock" &&
    modelId === "anthropic.claude-sonnet-4-20250514-v1:0"
  ) {
    const { inferenceProfile } = providerCfg.config as AwsProviderConfig;
    if (inferenceProfile) modelId = `${inferenceProfile}:${modelId}`;
  }
  return modelId;
};

const isEmbeddingModel = (model_type: string) => {
  supportedOrThrow(model_type);
  return (
    supportedModels.find((m) => m.name === model_type)?.modality === "embedding"
  );
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

export const pickChat = async (
  model: Models[number],
  providerCfg: ProviderConfig,
): Promise<LanguageModel> => {
  if (isEmbeddingModel(model.type)) {
    throw new BadRequestError(`Model '${model.type}' is an embedding model`);
  }
  const modelId = resolveModelId(model.type, providerCfg);
  const provider = await getOrCreateProvider(providerCfg);
  return provider.languageModel(modelId);
};

export const pickEmbedding = async (
  model: Models[number],
  providerCfg: ProviderConfig,
): Promise<EmbeddingModel<string>> => {
  if (!isEmbeddingModel(model.type)) {
    throw new BadRequestError(`Model '${model.type}' is a chat model`);
  }
  const modelId = resolveModelId(model.type, providerCfg);
  const provider = await getOrCreateProvider(providerCfg);
  return provider.textEmbeddingModel(modelId);
};
