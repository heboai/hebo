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

export const getModalityOrThrow = (type: string) => {
  const entry = supportedModels.find((m) => m.name === type);
  if (!entry)
    throw new BadRequestError(
      `Unknown or unsupported model '${type}'`,
      "model_unsupported",
    );
  return entry.modality;
};

type Creator = (config: ProviderConfig["config"]) => Promise<Provider>;
const PROVIDER_CREATORS: Record<ProviderName, Creator> = {
  bedrock: async (config) => {
    const { bedrockRoleArn, region } = config as AwsProviderConfig;
    const creds = await getAwsCreds(bedrockRoleArn, region);
    return createAmazonBedrock({ ...creds, region });
  },
  vertex: async (config) => {
    const { serviceAccountEmail, audience, location, project, baseURL } =
      config as GoogleProviderConfig;
    const credentials = buildAwsWifOptions(
      audience,
      serviceAccountEmail,
    ) as any;
    return createVertex({
      googleAuthOptions: {
        credentials,
        scopes: ["https://www.googleapis.com/auth/cloud-platform"],
      },
      location,
      project,
      baseURL,
    });
  },
  voyage: async (config) => createVoyage({ ...(config as any) }),
};
const createProvider = async (cfg: ProviderConfig): Promise<Provider> =>
  (await PROVIDER_CREATORS[cfg.name]?.(cfg.config)) ??
  Promise.reject(
    new BadRequestError(
      `Unknown or unsupported provider '${cfg.name}'`,
      "provider_unsupported",
    ),
  );

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
  if (providerCfg.name !== "bedrock") return modelId;
  const { bedrockRoleArn, region } = providerCfg.config as AwsProviderConfig;
  const credentials = await getAwsCreds(bedrockRoleArn, region);
  return getInferenceProfileArn(credentials, region, modelId);
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
