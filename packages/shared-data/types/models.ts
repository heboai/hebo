import { Type, type Static } from "@sinclair/typebox";

import { ProviderSlug } from "@hebo/database/src/types/providers";

import { SUPPORTED_MODELS } from "../models";

export const SupportedModelType = Type.Enum(
  Object.fromEntries(SUPPORTED_MODELS.map(({ type }) => [type, type])),
  { error: "Invalid model type" },
);

export const Models = Type.Array(
  Type.Object({
    alias: Type.String({ minLength: 1 }),
    type: SupportedModelType,
    // Inspired from Vercel Provider Options: https://vercel.com/docs/ai-gateway/provider-options
    routing: Type.Optional(Type.Object({ only: Type.Array(ProviderSlug) })),
  }),
);

export type Models = Static<typeof Models>;
