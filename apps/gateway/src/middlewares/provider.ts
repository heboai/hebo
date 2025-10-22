import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
import { createGroq } from "@ai-sdk/groq";
import Elysia from "elysia";
import { Resource } from "sst";
import { createVoyage } from "voyage-ai-provider";

import supportedModels from "@hebo/shared-data/json/supported-models";

import type { LanguageModel, EmbeddingModel } from "ai";

export const SUPPORTED_MODELS = supportedModels.map((m) => m.name);

const bedrock = createAmazonBedrock({
  region: "us-east-1",
  apiKey: (() => {
    try {
      // @ts-expect-error: GroqApiKey may not be defined
      return Resource.BedrockApiKey.value;
    } catch {
      return process.env.BEDROCK_API_KEY;
    }
  })(),
});

const groq = createGroq({
  apiKey: (() => {
    try {
      // @ts-expect-error: GroqApiKey may not be defined
      return Resource.GroqApiKey.value;
    } catch {
      return process.env.GROQ_API_KEY;
    }
  })(),
});

const voyage = createVoyage({
  apiKey: (() => {
    try {
      // @ts-expect-error: VoyageApiKey may not be defined
      return Resource.VoyageApiKey.value;
    } catch {
      return process.env.VOYAGE_API_KEY;
    }
  })(),
});

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

const pickChat = (id: string): LanguageModel => {
  const provider = supportedModels.find((m) => m.name === id)?.provider;
  switch (provider) {
    case "groq": {
      return groq(id);
    }
    case "bedrock": {
      return bedrock(id);
    }
    default: {
      throw badRequest(
        `Unknown or unsupported provider "${provider}"`,
        "provider_unsupported",
      );
    }
  }
};

const pickEmbedding = (id: string): EmbeddingModel<string> => {
  const provider = supportedModels.find((m) => m.name === id)?.provider;
  switch (provider) {
    case "voyage": {
      return voyage.textEmbeddingModel(id);
    }
    case "bedrock": {
      return bedrock.embedding(id);
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

const chatOrThrow = (id: string): LanguageModel => {
  supportedOrThrow(id);
  if (isEmbedding(id)) {
    throw badRequest(`Model "${id}" is an embedding model`);
  }
  return pickChat(id);
};

const embeddingOrThrow = (id: string): EmbeddingModel<string> => {
  supportedOrThrow(id);
  if (!isEmbedding(id)) {
    throw badRequest(`Model "${id}" is a chat model`);
  }
  return pickEmbedding(id);
};

export const provider = new Elysia({ name: "provider" })
  .decorate("provider", {
    chat: chatOrThrow,
    embedding: embeddingOrThrow,
  } as const)
  .as("scoped");
