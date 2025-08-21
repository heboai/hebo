import { createGroq } from "@ai-sdk/groq";
import { Elysia } from "elysia";
import { createVoyage } from "voyage-ai-provider";

import type { LanguageModel, EmbeddingModel } from "ai";

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY! });
const voyage = createVoyage({ apiKey: process.env.VOYAGE_API_KEY! });

const isEmbedding = (id: string) => /^voyage-/i.test(id);

const pickChat = (id: string): LanguageModel => {
  return groq(id);
};

const pickEmbedding = (id: string): EmbeddingModel<string> => {
  return voyage.textEmbeddingModel(id);
};

const chatOrThrow = (id: string): LanguageModel => {
  if (isEmbedding(id)) throw new Error(`Model "${id}" is an embedding model`);
  return pickChat(id);
};
const embeddingOrThrow = (id: string): EmbeddingModel<string> => {
  if (!isEmbedding(id)) throw new Error(`Model "${id}" is a chat model`);
  return pickEmbedding(id);
};

export const provider = new Elysia({ name: "provider" })
  .derive(() => ({
    provider: {
      chat: chatOrThrow,
      embedding: embeddingOrThrow,
    },
  }))
  .as("scoped");
