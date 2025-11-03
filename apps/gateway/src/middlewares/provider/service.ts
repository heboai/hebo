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

import { getInferenceProfileArn, getAwsCreds } from "./bedrock";
import { BadRequestError, ModelNotFoundError } from "./errors";
import { buildAwsWifOptions } from "./vertex";

import type { LanguageModel, Provider, EmbeddingModel } from "ai";

export const SUPPORTED_MODELS = supportedModels.map((m) => m.name).sort();

const DEFAULTS_BY_PROVIDER: Record<ProviderName, ProviderConfig> = {
  bedrock: {
    name: "bedrock",
    config: {
      bedrockRoleArn: await getEnvValue("BedrockRoleArn"),
      region: "us-east-1",
    },
  },
  vertex: {
    name: "vertex",
    config: {
      serviceAccountEmail: await getEnvValue("GoogleVertexServiceAccountEmail"),
      audience: await getEnvValue("GoogleVertexAwsProviderAudience"),
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
      const { bedrockRoleArn, region } = config as AwsProviderConfig;
      const { accessKeyId, secretAccessKey, sessionToken } = await getAwsCreds(
        bedrockRoleArn,
        region,
      );
      return createAmazonBedrock({
        accessKeyId,
        secretAccessKey,
        sessionToken,
        region,
      });
    }
    case "vertex": {
      const { serviceAccountEmail, audience, location, project, baseURL } =
        config as GoogleProviderConfig;
      const awsWifOptions = buildAwsWifOptions({
        serviceAccountEmail,
        audience,
      });
      return createVertex({
        googleAuthOptions: {
          credentials: awsWifOptions as any,
          scopes: ["https://www.googleapis.com/auth/cloud-platform"],
        },
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

// FUTURE: Use a more sophisticated cache mechanism
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

const resolveModelId = async (
  modelType: string,
  providerCfg: ProviderConfig,
): Promise<string> => {
  const supported = supportedModels.find((m) => m.name === modelType);
  const providerEntry = supported?.providers?.find(
    (p) => providerCfg.name in p,
  ) as Record<string, { id: string }>;
  const modelId = providerEntry[providerCfg.name]?.id;
  if (providerCfg.name === "bedrock") {
    const { bedrockRoleArn, region } = providerCfg.config as AwsProviderConfig;
    const credentials = await getAwsCreds(bedrockRoleArn, region);
    return await getInferenceProfileArn(credentials, region, modelId);
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
  const modelId = await resolveModelId(model.type, providerCfg);
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
  const modelId = await resolveModelId(model.type, providerCfg);
  const provider = await getOrCreateProvider(providerCfg);
  return provider.textEmbeddingModel(modelId);
};
