import { embed, embedMany } from "ai";
import { Elysia, t } from "elysia";

import { modelFactory } from "~gateway/middlewares/ai-model-factory";

export const embeddings = new Elysia({
  name: "embeddings",
  prefix: "/embeddings",
})
  .use(modelFactory)
  .post(
    "/",
    async ({ body, modelFactory }) => {
      const { model: fullModelAlias, input } = body;

      const embeddingModel = await modelFactory.createAIModelOrThrow({
        fullModelAlias,
        modality: "embedding",
      });

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
          model: fullModelAlias,
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
        model: fullModelAlias,
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
