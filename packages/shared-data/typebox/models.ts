import { Static, Type } from "@sinclair/typebox";

import supportedModels from "../json/supported-models.json";

type SupportedModelNameOnly = { name: string };
const SupportedModels = (supportedModels as SupportedModelNameOnly[]).map(
  (m) => m.name,
);

const ModelsSchema = Type.Array(
  Type.Object({
    alias: Type.String(),
    type: Type.String({ enum: SupportedModels }),
    endpoint: Type.Optional(
      Type.Object(
        {
          baseUrl: Type.String({ format: "uri" }),
          provider: Type.Union([Type.Literal("aws"), Type.Literal("custom")]),
          apiKey: Type.String({ minLength: 1, writeOnly: true }),
        },
        { additionalProperties: false },
      ),
    ),
  }),
);

export type ModelsSchema = Static<typeof ModelsSchema>;
