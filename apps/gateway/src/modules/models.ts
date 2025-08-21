import { Elysia, t } from "elysia";

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

  .get(
    "/:id",
    ({ params, set }) => {
      const { id } = params;
      if (!SUPPORTED_MODELS.includes(id)) {
        set.status = 404;
        return {
          error: {
            message: `The model '${id}' does not exist.`,
            type: "invalid_request_error",
            param: undefined,
            code: "model_not_found",
          },
        };
      }
      return { id, object: "model", owned_by: "gateway" };
    },
    {
      params: t.Object({ id: t.String() }),
    },
  );
