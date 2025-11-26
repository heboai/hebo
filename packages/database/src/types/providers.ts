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

const BedrockProviderConfig = Type.Object({
  bedrockRoleArn: Type.String(),
  region: Type.String(),
});

const VertexProviderConfig = Type.Object({
  serviceAccountEmail: Type.String(),
  audience: Type.String(),
  location: Type.String(),
  project: Type.String(),
});

const ApiKeyProviderConfig = Type.Object({
  apiKey: Type.String({ "x-redact": true }),
});

export const ProviderConfig = Type.Union([
  BedrockProviderConfig,
  VertexProviderConfig,
  ApiKeyProviderConfig,
]);

export const Provider = Type.Object({
  slug: ProviderSlug,
  name: Type.String(),
  config: Type.Optional(ProviderConfig),
});

export type BedrockProviderConfig = Static<typeof BedrockProviderConfig>;
export type VertexProviderConfig = Static<typeof VertexProviderConfig>;
export type ApiKeyProviderConfig = Static<typeof ApiKeyProviderConfig>;
export type Provider = Static<typeof Provider>;
export type ProviderConfig = Static<typeof ProviderConfig>;
export type ProviderSlug = Static<typeof ProviderSlug>;
