import { Type, type Static } from "@sinclair/typebox";

export const supportedProviders = {
  bedrock: { name: "Amazon Bedrock" },
  cohere: { name: "Cohere" },
  groq: { name: "Groq" },
  vertex: { name: "Google Vertex AI" },
} as const;

export const ProviderSlug = Type.Enum(
  Object.fromEntries(Object.keys(supportedProviders).map((k) => [k, k])),
  { error: "Invalid provider slug" },
);

const BedrockProviderConfigValue = Type.Object({
  bedrockRoleArn: Type.String(),
  region: Type.String(),
});

const VertexProviderConfigValue = Type.Object({
  serviceAccountEmail: Type.String(),
  audience: Type.String(),
  location: Type.String(),
  project: Type.String(),
});

const ApiKeyProviderConfigValue = Type.Object({
  apiKey: Type.String({ "x-redact": true }),
});

export const ProviderConfigValue = Type.Union([
  BedrockProviderConfigValue,
  VertexProviderConfigValue,
  ApiKeyProviderConfigValue,
]);

export const Provider = Type.Object({
  slug: ProviderSlug,
  name: Type.String(),
  config: Type.Optional(ProviderConfigValue),
});

export type BedrockProviderConfigValue = Static<
  typeof BedrockProviderConfigValue
>;
export type VertexProviderConfigValue = Static<
  typeof VertexProviderConfigValue
>;
export type ApiKeyProviderConfigValue = Static<
  typeof ApiKeyProviderConfigValue
>;
export type Provider = Static<typeof Provider>;
export type ProviderConfigValue = Static<typeof ProviderConfigValue>;
export type ProviderSlug = Static<typeof ProviderSlug>;
