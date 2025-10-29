import { Type, type Static } from "@sinclair/typebox";

import supportedModels from "../json/supported-models.json";

export const supportedModelsEnum = Type.Enum(
  Object.fromEntries(supportedModels.map(({ name }) => [name, name])),
  { error: "Invalid model name" },
);

export const modelsSchema = Type.Array(
  Type.Object({
    alias: Type.String(),
    type: supportedModelsEnum,
    customRouting: Type.Optional(
      Type.Union([
        Type.Literal("bedrock"),
        Type.Literal("vertex"),
        Type.Literal("voyage"),
      ]),
    ),
  }),
);

export type Models = Static<typeof modelsSchema>;
