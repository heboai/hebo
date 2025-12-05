import { embed, embedMany } from "ai";
import { Elysia, t } from "elysia";

import { aiModelFactory } from "~gateway/middlewares/ai-model-factory";

export const embeddings = new Elysia({
  name: "embeddings",
  prefix: "/embeddings",
})
  .use(aiModelFactory)
  .post(
    "/",
    async ({ body, aiModelFactory }) => {
      const { model: modelAliasPath, input } = body;

      const { model: embeddingModel } = await aiModelFactory.create(
        modelAliasPath,
        "embedding",
      );

      if (Array.isArray(input)) {
        const { embeddings, usage } = await embedMany({
          model: embeddingModel,
          values: input,
        });
        return {
          object: "list",
          data: embeddings.map((e, i) => ({
            object: "embedding",
            embedding: e,
            index: i,
          })),
          model: modelAliasPath,
          usage: usage && {
            prompt_tokens: usage.tokens ?? 0,
            total_tokens: usage.tokens ?? 0,
          },
        };
      }

      const { embedding, usage } = await embed({
        model: embeddingModel,
        value: input,
      });
      return {
        object: "list",
        data: [{ object: "embedding", embedding, index: 0 }],
        model: modelAliasPath,
        usage: usage && {
          prompt_tokens: usage.tokens ?? 0,
          total_tokens: usage.tokens ?? 0,
        },
      };
    },
    {
      body: t.Object({
        model: t.String({ minLength: 1 }),
        input: t.Union([
          t.String({ minLength: 1 }),
          t.Array(t.String(), { minItems: 1 }),
        ]),
      }),
    },
  );
