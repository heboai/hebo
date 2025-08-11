import { Type } from "@sinclair/typebox";

export const ModelCanonicalName = Type.Union(
  [
    // Todo: add more LLMs over time
    // Anthropic models
    Type.Literal("claude-3-5-sonnet-20241022"),
    Type.Literal("claude-3-haiku-20240307"),
    Type.Literal("claude-3-5-haiku-20241022"),
    // Voyage models
    Type.Literal("voyage-multimodal-3"),
    Type.Literal("voyage-3-large"),
  ],
  { $id: "models.schema.json#/$defs/ModelCanonicalName" },
);

export const refMap = {
  "models.schema.json#/$defs/ModelCanonicalName": ModelCanonicalName,
} as const;
