import { embed, embedMany } from "ai";
import { Elysia, t } from "elysia";
import { createVoyage } from "voyage-ai-provider";

const voyage = createVoyage({ apiKey: process.env.VOYAGE_API_KEY! });

export const embeddings = new Elysia({
  name: "embeddings",
  prefix: "/embeddings",
}).post(
  "/",
  async ({ body }) => {
    const { model, input } = body;

    if (Array.isArray(input)) {
      const { embeddings, usage } = await embedMany({
        model: voyage.textEmbeddingModel(model),
        values: input,
      });
      return {
        object: "list",
        data: embeddings.map((e, i) => ({
          object: "embedding",
          embedding: e,
          index: i,
        })),
        model,
        usage: usage && {
          prompt_tokens: usage.tokens ?? 0,
          total_tokens: usage.tokens ?? 0,
        },
      };
    } else {
      const { embedding, usage } = await embed({
        model: voyage.textEmbeddingModel(model),
        value: input,
      });
      return {
        object: "list",
        data: [{ object: "embedding", embedding, index: 0 }],
        model,
        usage: usage && {
          prompt_tokens: usage.tokens ?? 0,
          total_tokens: usage.tokens ?? 0,
        },
      };
    }
  },
  {
    body: t.Object({
      model: t.String(),
      input: t.Union([t.String(), t.Array(t.String())]),
    }),
  },
);
