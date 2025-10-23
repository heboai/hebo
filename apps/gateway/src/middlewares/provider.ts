import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
import { createVertex } from "@ai-sdk/google-vertex";
import { createGroq } from "@ai-sdk/groq";
import Elysia from "elysia";
import { Resource } from "sst";
import { createVoyage } from "voyage-ai-provider";

import supportedModels from "@hebo/shared-data/json/supported-models";
import type { Models } from "@hebo/shared-data/types/models";

import type { EmbeddingModel, LanguageModel, Provider } from "ai";

export const SUPPORTED_MODELS = supportedModels.map((m) => m.name);

const defaultBedrockaccessKeyId = (() => {
  try {
    // @ts-expect-error: AWSAccessKeyId may not be defined
    return Resource.AWSAccessKeyId.value;
  } catch {
    return process.env.AWS_ACCESS_KEY_ID;
  }
})();

const defaultBedrockSecretAccessKey = (() => {
  try {
    // @ts-expect-error: AWSSecretAccessKey may not be defined
    return Resource.AWSSecretAccessKey.value;
  } catch {
    return process.env.AWS_SECRET_ACCESS_KEY;
  }
})();

const defaultGroqApiKey = (() => {
  try {
    // @ts-expect-error: GroqApiKey may not be defined
    return Resource.GroqApiKey.value;
  } catch {
    return process.env.GROQ_API_KEY;
  }
})();

const defaultVertexServiceAccount = (() => {
  try {
    // @ts-expect-error: GoogleVertexServiceAccount may not be defined
    return Resource.GoogleVertexServiceAccount.value;
  } catch {
    return process.env.GOOGLE_VERTEX_SERVICE_ACCOUNT;
  }
})();

const defaultVertexProject = (() => {
  try {
    // @ts-expect-error: VertexProjectId may not be defined
    return Resource.GoogleVertexProject.value;
  } catch {
    return process.env.GOOGLE_VERTEX_PROJECT;
  }
})();

const defaultVoyageApiKey = (() => {
  try {
    // @ts-expect-error: VoyageApiKey may not be defined
    return Resource.VoyageApiKey.value;
  } catch {
    return process.env.VOYAGE_API_KEY;
  }
})();

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

const isEmbedding = (id: string) =>
  supportedModels.find((m) => m.name === id)?.modality === "embedding";

const createProvider = (model: Models[number]): Provider => {
  const provider =
    model.customRouting?.provider ||
    supportedModels.find((m) => m.name === model.type)?.provider;
  switch (provider) {
    case "bedrock": {
      return createAmazonBedrock({
        accessKeyId:
          model.customRouting?.bedrock?.accessKeyId ||
          defaultBedrockaccessKeyId,
        secretAccessKey:
          model.customRouting?.bedrock?.secretAccessKey ||
          defaultBedrockSecretAccessKey,
        region: model.customRouting?.bedrock?.region || "us-east-1",
        baseURL: model.customRouting?.baseUrl,
      });
    }
    case "groq": {
      return createGroq({
        apiKey: model.customRouting?.groq?.apiKey || defaultGroqApiKey,
        baseURL: model.customRouting?.baseUrl,
      });
    }
    case "vertex": {
      return createVertex({
        googleAuthOptions: {
          credentials:
            model.customRouting?.vertex?.serviceAccount ||
            defaultVertexServiceAccount,
        },
        location: model.customRouting?.vertex?.location || "us-central1",
        project: model.customRouting?.vertex?.project || defaultVertexProject,
        baseURL: model.customRouting?.baseUrl,
      });
    }
    case "voyage": {
      return createVoyage({
        apiKey: model.customRouting?.voyage?.apiKey || defaultVoyageApiKey,
        baseURL: model.customRouting?.baseUrl,
      });
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

const chatOrThrow = (model: Models[number]): LanguageModel => {
  if (isEmbedding(model.type)) {
    throw badRequest(`Model "${model.type}" is an embedding model`);
  }
  return createProvider(model).languageModel(model.type);
};

const embeddingOrThrow = (model: Models[number]): EmbeddingModel<string> => {
  if (!isEmbedding(model.type)) {
    throw badRequest(`Model "${model.type}" is a chat model`);
  }
  return createProvider(model).textEmbeddingModel(model.type);
};

export const provider = new Elysia({ name: "provider" })
  .decorate("provider", {
    chat: chatOrThrow,
    embedding: embeddingOrThrow,
  } as const)
  .as("scoped");
