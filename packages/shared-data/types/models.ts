import { Type, type Static } from "@sinclair/typebox";

import supportedModels from "../json/supported-models.json";

export const supportedModelsEnum = Type.Enum(
  Object.fromEntries(supportedModels.map(({ name }) => [name, name])),
  { error: "Invalid model name" },
);

const providerConfigSchema = Type.Union([
  Type.Object({
    baseUrl: Type.Optional(Type.String()),
    provider: Type.Literal("bedrock"),
    config: Type.Object({
      accessKeyId: Type.String(),
      secretAccessKey: Type.String(),
      region: Type.String(),
    }),
  }),
  Type.Object({
    baseUrl: Type.Optional(Type.String()),
    provider: Type.Literal("vertex"),
    config: Type.Object({
      serviceAccount: Type.Any({ format: "json" }),
      location: Type.String(),
      project: Type.String(),
    }),
  }),
  Type.Object({
    baseUrl: Type.Optional(Type.String()),
    provider: Type.Literal("voyage"),
    config: Type.Object({
      apiKey: Type.String(),
    }),
  }),
]);

// FUTURE: infer from models.schema.json
export const modelsSchema = Type.Array(
  Type.Object({
    alias: Type.String(),
    type: Type.Union([supportedModelsEnum, Type.String()]),
    customRouting: Type.Optional(providerConfigSchema),
  }),
);

export type Models = Static<typeof modelsSchema>;
export type ProviderConfig = Static<typeof providerConfigSchema>;
