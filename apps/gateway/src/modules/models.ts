import { Elysia } from "elysia";

import supportedModels from "@hebo/shared-data/supported-models.json";

const SUPPORTED_MODELS = supportedModels.map((m) => m.name);

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

  .get("/:id", ({ params, set }) => {
    const { id } = params;
    if (!SUPPORTED_MODELS.includes(id)) {
      set.status = 404;
      return { error: { message: "Model not found" } };
    }
    return { id, object: "model", owned_by: "gateway" };
  });
