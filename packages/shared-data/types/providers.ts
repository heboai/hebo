import { Type, type Static } from "@sinclair/typebox";

import supportedModels from "../json/supported-models.json";

export const ProviderNameEnum = Type.Enum(
  Object.fromEntries(
    [
      ...new Set(
        supportedModels.flatMap((model) =>
          (model.providers ?? []).flatMap((providerObj) =>
            Object.keys(providerObj),
          ),
        ),
      ),
    ].map((providerName) => [providerName, providerName]),
  ),
  { error: "Invalid provider name" },
);

const AwsProviderConfigSchema = Type.Object({
  bedrockRoleArn: Type.String(),
  region: Type.String(),
  baseURL: Type.Optional(Type.String()),
});

const GoogleProviderConfigSchema = Type.Object({
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
  AwsProviderConfigSchema,
  GoogleProviderConfigSchema,
  ApiKeyProviderConfigSchema,
]);

export const Provider = Type.Object({
  name: ProviderNameEnum,
  config: ProviderConfig,
});

export type AwsProviderConfig = Static<typeof AwsProviderConfigSchema>;
export type GoogleProviderConfig = Static<typeof GoogleProviderConfigSchema>;
export type ApiKeyProviderConfig = Static<typeof ApiKeyProviderConfigSchema>;

export type Provider = Static<typeof Provider>;
export type ProviderConfig = Static<typeof ProviderConfig>;
export type ProviderName = Static<typeof ProviderNameEnum>;
