import { embed, embedMany } from "ai";
import { Elysia, t } from "elysia";

import { dbClient } from "@hebo/shared-api/middlewares/db-client";

import { provider } from "~gateway/middlewares/provider";
import { getModelObject } from "~gateway/utils/get-model-object";

export const embeddings = new Elysia({
  name: "embeddings",
  prefix: "/embeddings",
})
  .use(dbClient)
  .use(provider)
  .post(
    "/",
    async ({ body, dbClient, provider }) => {
      const { model, input } = body;

      const modelObj = await getModelObject(dbClient, model);
      const embeddingModel = provider.embedding(modelObj);

      if (Array.isArray(input)) {
        const { embeddings, usage } = await embedMany({
          model: embeddingModel,
          values: input,
        });
        return {
          object: "list",
          data: embeddings.map((e: number[], i: number) => ({
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
      }

      const { embedding, usage } = await embed({
        model: embeddingModel,
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
