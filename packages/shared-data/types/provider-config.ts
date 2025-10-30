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
  accessKeyId: Type.String({ "x-redact": true }),
  secretAccessKey: Type.String({ "x-redact": true }),
  region: Type.String(),
  baseURL: Type.Optional(Type.String()),
});

const GoogleProviderConfigSchema = Type.Object({
  serviceAccount: Type.Any({ format: "json", "x-redact": true }),
  location: Type.String(),
  project: Type.String(),
  baseURL: Type.Optional(Type.String()),
});

const ApiKeyProviderConfigSchema = Type.Object({
  apiKey: Type.String({ "x-redact": true }),
  baseURL: Type.Optional(Type.String()),
});

export const ProviderConfigConfig = Type.Union([
  AwsProviderConfigSchema,
  GoogleProviderConfigSchema,
  ApiKeyProviderConfigSchema,
]);

export const ProviderConfig = Type.Object({
  name: ProviderNameEnum,
  config: ProviderConfigConfig,
});

export type AwsProviderConfig = Static<typeof AwsProviderConfigSchema>;
export type GoogleProviderConfig = Static<typeof GoogleProviderConfigSchema>;
export type ApiKeyProviderConfig = Static<typeof ApiKeyProviderConfigSchema>;

export type ProviderConfigConfig = Static<typeof ProviderConfigConfig>;
export type ProviderConfig = Static<typeof ProviderConfig>;
export type ProviderName = Static<typeof ProviderNameEnum>;
