import { Type, type Static } from "@sinclair/typebox";

import { ProviderNameEnum } from "@hebo/database/src/types/providers";

import supportedModels from "../json/supported-models.json";

export const SupportedModelsEnum = Type.Enum(
  Object.fromEntries(supportedModels.map(({ type }) => [type, type])),
  { error: "Invalid model type" },
);

export const ModelsSchema = Type.Array(
  Type.Object({
    alias: Type.String({ minLength: 1 }),
    type: SupportedModelsEnum,
    // Inspired from Vercel Provider Options: https://vercel.com/docs/ai-gateway/provider-options
    routing: Type.Optional(Type.Object({ only: Type.Array(ProviderNameEnum) })),
  }),
);

export type Models = Static<typeof ModelsSchema>;
