import { Type, type Static } from "@sinclair/typebox";

import supportedModels from "../json/supported-models.json";

export const SupportedModelsEnum = Type.Enum(
  Object.fromEntries(supportedModels.map(({ name }) => [name, name])),
  { error: "Invalid model name" },
);

export const ModelsSchema = Type.Array(
  Type.Object({
    alias: Type.String({ minLength: 1 }),
    type: SupportedModelsEnum,
    customProvider: Type.Optional(Type.Boolean()),
  }),
);

export type Models = Static<typeof ModelsSchema>;
