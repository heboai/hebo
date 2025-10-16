import { t } from "elysia";

import supportedModels from "@hebo/shared-data/json/supported-models";

export const supportedModelsUnion = t.Union(
  supportedModels.map(({ name }) => t.Literal(name)),
  {
    error() {
      return "Invalid model name";
    },
  },
);

// FUTURE: infer from models.schema.json
export const modelsSchema = t.Array(
  t.Object({
    alias: t.String(),
    type: supportedModelsUnion,
    endpoint: t.Optional(
      t.Object({
        baseUrl: t.String(),
        apiKey: t.String(),
      }),
    ),
  }),
);

export type Models = typeof modelsSchema.static;
