import { Type, type Static } from "@sinclair/typebox";

import supportedModels from "../json/supported-models.json";

export const supportedModelsEnum = Type.Enum(
  Object.fromEntries(supportedModels.map(({ name }) => [name, name])),
  { error: "Invalid model name" },
);

// FUTURE: infer from models.schema.json
export const modelsSchema = Type.Array(
  Type.Object({
    alias: Type.String(),
    type: supportedModelsEnum,
    endpoint: Type.Optional(
      Type.Object({
        baseUrl: Type.String(),
        apiKey: Type.String(),
      }),
    ),
  }),
);

export type Models = Static<typeof modelsSchema>;
