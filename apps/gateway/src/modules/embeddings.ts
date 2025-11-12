import { embed, embedMany } from "ai";
import { Elysia, t } from "elysia";

import { dbClient } from "@hebo/shared-api/middlewares/db-client";

import {
  getModelObject,
  getProviderConfig,
  pickModel,
} from "~gateway/middlewares/providers/service";

export const embeddings = new Elysia({
  name: "embeddings",
  prefix: "/embeddings",
})
  .use(dbClient)
  .post(
    "/",
    async ({ body, dbClient }) => {
      const { model, input } = body;
      const foundModel = await getModelObject(dbClient, model);
      const embeddingModel = await pickModel(
        foundModel,
        await getProviderConfig(foundModel, dbClient),
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
