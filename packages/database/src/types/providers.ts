import { Type, type Static } from "@sinclair/typebox";

export const supportedProviders = {
  bedrock: { name: "Amazon Bedrock" },
  cohere: { name: "Cohere" },
  groq: { name: "Groq" },
  vertex: { name: "Google Vertex AI" },
} as const;

export const ProviderSlugEnum = Type.Enum(
  Object.fromEntries(Object.keys(supportedProviders).map((k) => [k, k])),
  { error: "Invalid provider slug" },
);

const BedrockProviderConfigSchema = Type.Object({
  bedrockRoleArn: Type.String(),
  region: Type.String(),
});

const VertexProviderConfigSchema = Type.Object({
  serviceAccountEmail: Type.String(),
  audience: Type.String(),
  location: Type.String(),
  project: Type.String(),
});

const ApiKeyProviderConfigSchema = Type.Object({
  apiKey: Type.String({ "x-redact": true }),
});

export const ProviderConfig = Type.Union([
  BedrockProviderConfigSchema,
  VertexProviderConfigSchema,
  ApiKeyProviderConfigSchema,
]);

export const Provider = Type.Object({
  slug: ProviderSlugEnum,
  config: ProviderConfig,
});

export const ProvidersWithDisplayName = Type.Array(
  Type.Object({
    slug: ProviderSlugEnum,
    name: Type.String(),
    config: Type.Optional(ProviderConfig),
  }),
);

export type BedrockProviderConfig = Static<typeof BedrockProviderConfigSchema>;
export type VertexProviderConfig = Static<typeof VertexProviderConfigSchema>;
export type ApiKeyProviderConfig = Static<typeof ApiKeyProviderConfigSchema>;

export type Provider = Static<typeof Provider>;
export type ProviderConfig = Static<typeof ProviderConfig>;
export type ProviderSlug = keyof typeof supportedProviders;
