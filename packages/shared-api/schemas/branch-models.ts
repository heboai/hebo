import { t } from "elysia";

import supportedModels from "@hebo/shared-data/json/supported-models";

export const supportedModelsEnum = t.Enum(
  Object.fromEntries(supportedModels.map(({ name }) => [name, name])),
  { error: "Invalid model name" },
);

// FUTURE: infer from models.schema.json
export const modelsSchema = t.Array(
  t.Object({
    alias: t.String(),
    type: supportedModelsEnum,
    endpoint: t.Optional(
      t.Object({
        baseUrl: t.String(),
        apiKey: t.String(),
      }),
    ),
  }),
);

export type Models = typeof modelsSchema.static;
