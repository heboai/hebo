import { embed, embedMany } from "ai";
import { Elysia, t } from "elysia";

import { provider } from "~/middleware/provider";

export const embeddings = new Elysia({
  name: "embeddings",
  prefix: "/embeddings",
})
  .use(provider)
  .post(
    "/",
    async ({ body, provider }) => {
      const { model, input } = body;

      if (Array.isArray(input)) {
        const { embeddings, usage } = await embedMany({
          model: provider.embedding(model),
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
        model: provider.embedding(model),
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
        model: t.String(),
        input: t.Union([t.String(), t.Array(t.String())]),
      }),
    },
  );
