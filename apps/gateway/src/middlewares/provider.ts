import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
import { createVertex } from "@ai-sdk/google-vertex";
import Elysia from "elysia";
import { Resource } from "sst";
import { createVoyage } from "voyage-ai-provider";

import supportedModels from "@hebo/shared-data/json/supported-models";
import type { Models, ProviderConfig } from "@hebo/shared-data/types/models";

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

type ProviderName = ProviderConfig["provider"];
const DEFAULTS_BY_PROVIDER: Record<ProviderName, ProviderConfig> = {
  bedrock: {
    provider: "bedrock",
    config: {
      accessKeyId: (() => {
        try {
          // @ts-expect-error: AWSAccessKeyId may not be defined
          return Resource.AWSAccessKeyId.value;
        } catch {
          return process.env.AWS_ACCESS_KEY_ID;
        }
      })(),
      secretAccessKey: (() => {
        try {
          // @ts-expect-error: AWSSecretAccessKey may not be defined
          return Resource.AWSSecretAccessKey.value;
        } catch {
          return process.env.AWS_SECRET_ACCESS_KEY;
        }
      })(),
      inferenceProfile: (() => {
        try {
          // @ts-expect-error: BedrockInferenceProfile may not be defined
          return Resource.BedrockInferenceProfile.value;
        } catch {
          return process.env.BEDROCK_INFERENCE_PROFILE;
        }
      })(),
      region: "us-east-1",
    },
  },
  vertex: {
    provider: "vertex",
    config: {
      serviceAccount: (() => {
        try {
          return JSON.parse(
            // @ts-expect-error: GoogleVertexServiceAccount may not be defined
            Resource.GoogleVertexServiceAccount.value as string,
          );
        } catch {
          return JSON.parse(
            process.env.GOOGLE_VERTEX_SERVICE_ACCOUNT as string,
          );
        }
      })(),
      location: "us-central1",
      project: (() => {
        try {
          // @ts-expect-error: GoogleVertexProject may not be defined
          return Resource.GoogleVertexProject.value;
        } catch {
          return process.env.GOOGLE_VERTEX_PROJECT;
        }
      })(),
    },
  },
  voyage: {
    provider: "voyage",
    config: {
      apiKey: (() => {
        try {
          // @ts-expect-error: VoyageApiKey may not be defined
          return Resource.VoyageApiKey.value;
        } catch {
          return process.env.VOYAGE_API_KEY;
        }
      })(),
    },
  },
};

const getProviderConfig = (model: Models[number]): ProviderConfig => {
  const { customRouting } = model;
  if (customRouting) return customRouting;

  const provider = supportedModels.find((m) => m.name === model.type)
    ?.provider as ProviderName | undefined;
  if (!provider) {
    throw new BadRequestError(
      `Unknown or unsupported provider "${provider}"`,
      "provider_unsupported",
    );
  }
  return DEFAULTS_BY_PROVIDER[provider];
};

const createProvider = (model: Models[number]): Provider => {
  const cfg = getProviderConfig(model);
  const { provider, baseUrl: baseURL, config } = cfg;
  switch (provider) {
    case "bedrock": {
      return createAmazonBedrock({ ...config, baseURL });
    }
    case "vertex": {
      return createVertex({
        googleAuthOptions: { credentials: config.serviceAccount },
        location: config.location,
        project: config.project,
        baseURL,
      });
    }
    case "voyage": {
      return createVoyage({ ...config, baseURL });
    }
    default: {
      throw new BadRequestError(
        `Unknown or unsupported provider '${provider}'`,
        "provider_unsupported",
      );
    }
  }
};

export const supportedOrThrow = (id: string) => {
  if (!SUPPORTED_MODELS.includes(id)) {
    throw new BadRequestError(
      `Unknown or unsupported model '${id}'`,
      "model_unsupported",
    );
  }
};

const providerInstances = new Map<string, Provider>();

const getOrCreateProvider = (model: Models[number]): Provider => {
  const key =
    model.type +
    (model.customRouting ? JSON.stringify(model.customRouting) : "");
  if (providerInstances.has(key)) {
    return providerInstances.get(key)!;
  }

  const instance = createProvider(model);
  providerInstances.set(key, instance);
  return instance;
};

const isEmbeddingModel = (model_type: string) => {
  supportedOrThrow(model_type);
  return (
    supportedModels.find((m) => m.name === model_type)?.modality === "embedding"
  );
};

const pickChat = (model: Models[number]): LanguageModel => {
  if (isEmbeddingModel(model.type))
    throw new BadRequestError(`Model '${model.type}' is an embedding model`);
  const providerCfg = getProviderConfig(model);
  let modelId = model.type;
  if (
    providerCfg.provider === "bedrock" &&
    model.type === "anthropic.claude-sonnet-4-20250514-v1:0"
  ) {
    modelId = `${providerCfg.config.inferenceProfile!}:${model.type}`;
  }
  return getOrCreateProvider(model).languageModel(modelId);
};

const pickEmbedding = (model: Models[number]): EmbeddingModel<string> => {
  if (!isEmbeddingModel(model.type))
    throw new BadRequestError(`Model '${model.type}' is a chat model`);
  return getOrCreateProvider(model).textEmbeddingModel(model.type);
};

export const provider = new Elysia({ name: "provider" })
  .decorate("provider", {
    chat(model: Models[number]) {
      return pickChat(model);
    },
    embedding(model: Models[number]) {
      return pickEmbedding(model);
    },
  } as const)
  .as("scoped");
