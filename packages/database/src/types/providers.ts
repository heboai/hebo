import { Type, type Static } from "@sinclair/typebox";

export const ProviderNameEnum = Type.Enum(
  { bedrock: "bedrock", vertex: "vertex", groq: "groq" },
  { error: "Invalid provider name" },
);

const BedrockProviderConfigSchema = Type.Object({
  bedrockRoleArn: Type.String(),
  region: Type.String(),
  baseURL: Type.Optional(Type.String()),
});

const VertexProviderConfigSchema = Type.Object({
  serviceAccountEmail: Type.String(),
  audience: Type.String(),
  location: Type.String(),
  project: Type.String(),
  baseURL: Type.Optional(Type.String()),
});

const ApiKeyProviderConfigSchema = Type.Object({
  apiKey: Type.String({ "x-redact": true }),
  baseURL: Type.Optional(Type.String()),
});

export const ProviderConfig = Type.Union([
  BedrockProviderConfigSchema,
  VertexProviderConfigSchema,
  ApiKeyProviderConfigSchema,
]);

export const Provider = Type.Object({
  name: ProviderNameEnum,
  config: ProviderConfig,
});

export type BedrockProviderConfig = Static<typeof BedrockProviderConfigSchema>;
export type VertexProviderConfig = Static<typeof VertexProviderConfigSchema>;
export type ApiKeyProviderConfig = Static<typeof ApiKeyProviderConfigSchema>;

export type Provider = Static<typeof Provider>;
export type ProviderConfig = Static<typeof ProviderConfig>;
export type ProviderName = Static<typeof ProviderNameEnum>;
