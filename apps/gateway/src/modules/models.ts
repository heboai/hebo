import { Elysia, t } from "elysia";

import supportedModels from "@hebo/shared-data/json/supported-models";
import { SupportedModelsEnum } from "@hebo/shared-data/types/models";

import { getSupportedModelOrThrow } from "~gateway/middlewares/ai-models/ai-model-service";

export const models = new Elysia({
  name: "models",
  prefix: "/models",
})
  .get(
    "/",
    () => {
      return {
        object: "list" as const,
        data: supportedModels
          .map((m) => m.name)
          .sort()
          .map((id) => ({
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

      getSupportedModelOrThrow(id);

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
        id: SupportedModelsEnum,
      }),
      response: t.Object({
        id: t.String(),
        object: t.Literal("model"),
        created: t.Number(),
        owned_by: t.String(),
      }),
    },
  );
