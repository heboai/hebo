import { Type, type Static } from "@sinclair/typebox";

import { ProviderNameEnum, SupportedModelsEnum } from "./enums";

export const ModelsSchema = Type.Array(
  Type.Object({
    alias: Type.String({ minLength: 1 }),
    type: SupportedModelsEnum,
    customProvider: Type.Optional(ProviderNameEnum),
  }),
);

export type Models = Static<typeof ModelsSchema>;
