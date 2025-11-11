import { Type } from "@sinclair/typebox";

import supportedModels from "../json/supported-models.json";

export const SupportedModelsEnum = Type.Enum(
  Object.fromEntries(supportedModels.map(({ name }) => [name, name])),
  { error: "Invalid model name" },
);

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
