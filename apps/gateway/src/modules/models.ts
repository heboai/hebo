import { Elysia, t } from "elysia";

import supportedModels from "@hebo/shared-data/supported-models.json";

const SUPPORTED_MODELS = supportedModels.map((m) => m.name).sort();

export const models = new Elysia({
  name: "models",
  prefix: "/models",
})

  .get("/", () => {
    return {
      object: "list",
      data: SUPPORTED_MODELS.map((id) => ({
        id,
        object: "model",
        owned_by: "gateway",
      })),
    };
  })

  .get(
    "/:id",
    ({ params }) => {
      const { id } = params;
      return { id, object: "model", owned_by: "gateway" };
    },
    {
      params: t.Object(t.String({ enum: [...SUPPORTED_MODELS] })),
    },
  );
