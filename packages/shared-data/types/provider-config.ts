import { Type, type Static } from "@sinclair/typebox";

export const ProviderConfig = Type.Union([
  Type.Object({
    provider: Type.Literal("bedrock"),
    config: Type.Object({
      accessKeyId: Type.String({ "x-redact": true }),
      secretAccessKey: Type.String({ "x-redact": true }),
      region: Type.String(),
      inferenceProfile: Type.Optional(Type.String()),
      baseURL: Type.Optional(Type.String()),
    }),
  }),
  Type.Object({
    provider: Type.Literal("vertex"),
    config: Type.Object({
      serviceAccount: Type.Any({ format: "json", "x-redact": true }),
      location: Type.String(),
      project: Type.String(),
      baseURL: Type.Optional(Type.String()),
    }),
  }),
  Type.Object({
    provider: Type.Literal("voyage"),
    config: Type.Object({
      apiKey: Type.String({ "x-redact": true }),
      baseURL: Type.Optional(Type.String()),
    }),
  }),
]);

export type ProviderConfig = Static<typeof ProviderConfig>;
