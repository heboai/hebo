import { Elysia, t } from "elysia";

import { SUPPORTED_MODELS, supportedOrThrow } from "~/middleware/provider";

export const models = new Elysia({
  name: "models",
  prefix: "/models",
})

  .get(
    "/",
    () => {
      return {
        object: "list" as const,
        data: SUPPORTED_MODELS.map((id) => ({
          id,
          object: "model" as const,
          // FUTURE implement real value in supported models
          created: Math.floor(Date.now() / 1000),
          owned_by: "gateway",
        })),
      };
    },
    {
      response: t.Object({
        object: t.Literal("list"),
        data: t.Array(
          t.Object({
            id: t.String(),
            object: t.Literal("model"),
            created: t.Number(),
            owned_by: t.String(),
          }),
        ),
      }),
    },
  )

  .get(
    "/:id",
    ({ params }) => {
      const { id } = params;

      supportedOrThrow(id);

      return {
        id,
        object: "model",
        // FUTURE implement real value in supported models
        created: Math.floor(Date.now() / 1000),
        owned_by: "gateway",
      };
    },
    {
      params: t.Object({
        id: t.String({ enum: [...SUPPORTED_MODELS] }),
      }),
      response: t.Object({
        id: t.String(),
        object: t.Literal("model"),
        created: t.Number(),
        owned_by: t.String(),
      }),
    },
  );
