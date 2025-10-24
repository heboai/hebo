import { Type, type Static } from "@sinclair/typebox";

import supportedModels from "../json/supported-models.json";

export const supportedModelsEnum = Type.Enum(
  Object.fromEntries(supportedModels.map(({ name }) => [name, name])),
  { error: "Invalid model name" },
);

// FUTURE: infer from models.schema.json
export const modelsSchema = Type.Array(
  Type.Object({
    alias: Type.String(),
    type: Type.Union([supportedModelsEnum, Type.String()]),
    customRouting: Type.Optional(
      Type.Object({
        baseUrl: Type.Optional(Type.String()),
        provider: Type.Enum(
          Object.fromEntries(
            supportedModels.map(({ provider }) => [provider, provider]),
          ),
          { error: "Invalid provider" },
        ),
        bedrock: Type.Optional(
          Type.Object({
            accessKeyId: Type.String(),
            secretAccessKey: Type.String(),
            region: Type.String(),
          }),
        ),
        vertex: Type.Optional(
          Type.Object({
            serviceAccount: Type.Any({ format: "json" }),
            location: Type.String(),
            project: Type.String(),
          }),
        ),
        voyage: Type.Optional(
          Type.Object({
            apiKey: Type.String(),
          }),
        ),
      }),
    ),
  }),
);

export type Models = Static<typeof modelsSchema>;
