import { embed, embedMany } from "ai";
import { Elysia, t } from "elysia";

import { dbClient } from "@hebo/shared-api/middlewares/db-client";

import {
  createAIModel,
  getModelConfig,
  getProviderConfig,
} from "~gateway/middlewares/providers/service";

export const embeddings = new Elysia({
  name: "embeddings",
  prefix: "/embeddings",
})
  .use(dbClient)
  .post(
    "/",
    async ({ body, dbClient }) => {
      const { model: fullModelAlias, input } = body;

      const modelConfig = await getModelConfig(dbClient, fullModelAlias);
      const providerConfig = await getProviderConfig(dbClient, modelConfig);
      const embeddingModel = await createAIModel(
        modelConfig,
        providerConfig,
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
