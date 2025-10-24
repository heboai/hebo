import { Type, type Static } from "@sinclair/typebox";

import supportedModels from "../json/supported-models.json";

export const supportedModelsEnum = Type.Enum(
  Object.fromEntries(supportedModels.map(({ name }) => [name, name])),
  { error: "Invalid model name" },
);

export const providerConfigSchema = Type.Union([
  Type.Object({
    baseUrl: Type.Optional(Type.String()),
    provider: Type.Literal("bedrock"),
    config: Type.Object({
      accessKeyId: Type.String({ "x-redact": true }),
      secretAccessKey: Type.String({ "x-redact": true }),
      region: Type.String(),
    }),
  }),
  Type.Object({
    baseUrl: Type.Optional(Type.String()),
    provider: Type.Literal("vertex"),
    config: Type.Object({
      serviceAccount: Type.Any({ format: "json", "x-redact": true }),
      location: Type.String(),
      project: Type.String(),
    }),
  }),
  Type.Object({
    baseUrl: Type.Optional(Type.String()),
    provider: Type.Literal("voyage"),
    config: Type.Object({
      apiKey: Type.String({ "x-redact": true }),
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
