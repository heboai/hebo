import { Type, Static } from "@sinclair/typebox";

// -----------------------------------------------------------------------------
// TypeBox Schemas
// -----------------------------------------------------------------------------
// Supported providers literal union
export const SupportedProviders = Type.Union([
  // Todo: add more providers over time
  Type.Literal("aws"),
  Type.Literal("custom"),
]);

// Supported LLM models literal union
export const SupportedLLMs = Type.Union([
  // Todo: add more LLMs over time
  Type.Literal("claude-3-5-sonnet-20241022"),
  Type.Literal("claude-3-haiku-20240307"),
  Type.Literal("claude-3-5-haiku-20241022"),
]);

// Endpoint schema
export const EndpointSchema = Type.Object({
  url: Type.String({ format: "uri" }),
  provider: SupportedProviders,
  apiKey: Type.String({ minLength: 1 }),
});

// Model schema
export const ModelSchema = Type.Object({
  alias: Type.String({ minLength: 1 }),
  LLM: SupportedLLMs, 
  endpoint: Type.Optional(EndpointSchema),
});

// Collection of models must contain at least one entry
export const ModelsSchema = Type.Array(ModelSchema, { minItems: 1 });

// -----------------------------------------------------------------------------
// Inferred Types
// -----------------------------------------------------------------------------
export type SupportedProvider = Static<typeof SupportedProviders>;
export type SupportedLLM = Static<typeof SupportedLLMs>;
export type Endpoint = Static<typeof EndpointSchema>;
export type Model = Static<typeof ModelSchema>;
export type Models = Static<typeof ModelsSchema>;
