import { createGroq } from "@ai-sdk/groq";
import { Elysia } from "elysia";
import { createVoyage } from "voyage-ai-provider";

import type { LanguageModel, EmbeddingModel } from "ai";

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY! });
const voyage = createVoyage({ apiKey: process.env.VOYAGE_API_KEY! });

const isEmbedding = (id: string) => /^voyage-/i.test(id);

// FUTURE support AWS Bedrock
const pickChat = (id: string): LanguageModel => groq(id);

const pickEmbedding = (id: string): EmbeddingModel<string> =>
  voyage.textEmbeddingModel(id);

const chatOrThrow = (id: string): LanguageModel => {
  if (isEmbedding(id)) {
    const err = new Error(`Model "${id}" is an embedding model`) as Error & {
      status: number;
      type: string;
      code: string;
    };
    err.status = 400;
    err.type = "invalid_request_error";
    err.code = "model_mismatch";
    throw err;
  }
  return pickChat(id);
};

const embeddingOrThrow = (id: string): EmbeddingModel<string> => {
  if (!isEmbedding(id)) {
    const err = new Error(`Model "${id}" is a chat model`) as Error & {
      status: number;
      type: string;
      code: string;
    };
    err.status = 400;
    err.type = "invalid_request_error";
    err.code = "model_mismatch";
    throw err;
  }
  return pickEmbedding(id);
};

export const provider = new Elysia({ name: "provider" })
  .decorate("provider", {
    chat: chatOrThrow,
    embedding: embeddingOrThrow,
  } as const)
  .as("scoped");
