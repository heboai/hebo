import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
import { createVertex } from "@ai-sdk/google-vertex";
import Elysia from "elysia";
import { Resource } from "sst";
import { createVoyage } from "voyage-ai-provider";

import supportedModels from "@hebo/shared-data/json/supported-models";
import type { Models, ProviderConfig } from "@hebo/shared-data/types/models";

import type { Provider } from "ai";

export const SUPPORTED_MODELS = supportedModels.map((m) => m.name).sort();

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
      region: "us-east-1",
    },
  },
  vertex: {
    provider: "vertex",
    config: {
      serviceAccount: (() => {
        try {
          // @ts-expect-error: GoogleVertexServiceAccount may not be defined
          return Resource.GoogleVertexServiceAccount.value;
        } catch {
          return process.env.GOOGLE_VERTEX_SERVICE_ACCOUNT;
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

const badRequest = (message: string, code = "model_mismatch") => {
  const err = new Error(message) as Error & {
    status: number;
    type: string;
    code: string;
  };
  err.status = 400;
  err.type = "invalid_request_error";
  err.code = code;
  return err;
};

const getProviderConfig = (model: Models[number]): ProviderConfig => {
  const { customRouting } = model;
  if (customRouting) return customRouting;

  const provider = supportedModels.find((m) => m.name === model.type)
    ?.provider as ProviderName | undefined;
  if (!provider) {
    throw badRequest(
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
      throw badRequest(
        `Unknown or unsupported provider "${provider}"`,
        "provider_unsupported",
      );
    }
  }
};

export const supportedOrThrow = (id: string) => {
  if (!SUPPORTED_MODELS.includes(id)) {
    throw badRequest(
      `Unknown or unsupported model "${id}"`,
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

export const provider = new Elysia({ name: "provider" })
  .decorate("provider", {
    chat(model: Models[number]) {
      return getOrCreateProvider(model).languageModel(model.type);
    },
    embedding(model: Models[number]) {
      return getOrCreateProvider(model).textEmbeddingModel(model.type);
    },
  } as const)
  .as("scoped");
