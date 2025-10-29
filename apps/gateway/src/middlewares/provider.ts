import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
import { createVertex } from "@ai-sdk/google-vertex";
import Elysia from "elysia";
import { createVoyage } from "voyage-ai-provider";

import type { createDbClient } from "@hebo/database/client";
import { dbClient } from "@hebo/shared-api/middlewares/db-client";
import { getEnvValue } from "@hebo/shared-api/utils/get-env";
import supportedModels from "@hebo/shared-data/json/supported-models";
import type { Models } from "@hebo/shared-data/types/models";
import type {
  AwsProviderConfig,
  GoogleProviderConfig,
  ProviderConfig,
  ProviderName,
} from "@hebo/shared-data/types/provider-config";

import { getModelObject } from "~gateway/utils/get-model-object";

import type { LanguageModel, Provider, EmbeddingModel } from "ai";

export const SUPPORTED_MODELS = supportedModels.map((m) => m.name).sort();

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

const getProviderConfig = async (
  model: Models[number],
  dbClient: ReturnType<typeof createDbClient>,
): Promise<ProviderConfig> => {
  const name = (supportedModels.find((m) => m.name === model.type)?.provider ||
    model.customRouting) as ProviderName;
  if (model.customRouting) {
    const { config } = await dbClient.providerConfigs.getUnredacted(name);
    if (config) return { name, config } as ProviderConfig;
  }
  return DEFAULTS_BY_PROVIDER[name];
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

export const supportedOrThrow = (type: string) => {
  if (!SUPPORTED_MODELS.includes(type)) {
    throw new BadRequestError(
      `Unknown or unsupported model '${type}'`,
      "model_unsupported",
    );
  }
};

const providerInstances = new Map<string, Provider>();

const getOrCreateProvider = async (
  model: Models[number],
  cfg: ProviderConfig,
): Promise<Provider> => {
  const key = `${model.type}:${JSON.stringify(cfg.config)}`;
  if (providerInstances.has(key)) {
    return providerInstances.get(key)!;
  }
  const instance = await createProvider(cfg);
  providerInstances.set(key, instance);
  return instance;
};

const isEmbeddingModel = (model_type: string) => {
  supportedOrThrow(model_type);
  return (
    supportedModels.find((m) => m.name === model_type)?.modality === "embedding"
  );
};

const pickChat = async (
  model: Models[number],
  providerCfg: ProviderConfig,
): Promise<LanguageModel> => {
  if (isEmbeddingModel(model.type))
    throw new BadRequestError(`Model '${model.type}' is an embedding model`);
  let modelId = model.type;
  if (
    providerCfg.name === "bedrock" &&
    model.type === "anthropic.claude-sonnet-4-20250514-v1:0"
  ) {
    modelId = `${(providerCfg.config as AwsProviderConfig).inferenceProfile!}:${model.type}`;
  }
  const provider = await getOrCreateProvider(model, providerCfg);
  return provider.languageModel(modelId);
};

const pickEmbedding = async (
  model: Models[number],
  providerCfg: ProviderConfig,
): Promise<EmbeddingModel<string>> => {
  if (!isEmbeddingModel(model.type))
    throw new BadRequestError(`Model '${model.type}' is a chat model`);
  const provider = await getOrCreateProvider(model, providerCfg);
  return provider.textEmbeddingModel(model.type);
};

export const provider = new Elysia({ name: "provider" })
  .use(dbClient)
  .resolve(({ dbClient }) => ({
    provider: {
      async chat(model_alias: string) {
        const model = await getModelObject(dbClient, model_alias);
        const provider = await getProviderConfig(model, dbClient);
        return pickChat(model, provider);
      },
      async embedding(model_alias: string) {
        const model = await getModelObject(dbClient, model_alias);
        const provider = await getProviderConfig(model, dbClient);
        return pickEmbedding(model, provider);
      },
    },
  }))
  .as("scoped");
