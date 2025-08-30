import { createGroq } from "@ai-sdk/groq";
import { Elysia } from "elysia";
import { createVoyage } from "voyage-ai-provider";

import supportedModels from "@hebo/shared-data/json/supported-models";

import type { LanguageModel, EmbeddingModel } from "ai";

export const SUPPORTED_MODELS = supportedModels.map((m) => m.name).sort();

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY! });
const voyage = createVoyage({ apiKey: process.env.VOYAGE_API_KEY! });

// FUTURE more robust logic based on supported-models.json
const isEmbedding = (id: string) => /^voyage-/i.test(id);

// FUTURE support AWS Bedrock
const pickChat = (id: string): LanguageModel => groq(id);

const pickEmbedding = (id: string): EmbeddingModel<string> =>
  voyage.textEmbeddingModel(id);

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
