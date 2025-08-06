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

// Custom endpoint schema
export const CustomEndpointSchema = Type.Object({
  url: Type.String({ format: "uri" }),
  provider: SupportedProviders,
  apiKey: Type.String({ minLength: 1 }),
});

// Routing schemas
export const RoutingDefaultSchema = Type.Object({
  // Todo: enable cheapest and fastest routing options in the future
  type: Type.Literal("default"),
});

export const RoutingCustomSchema = Type.Object({
  type: Type.Literal("custom"),
  customEndpoint: CustomEndpointSchema,
});

export const RoutingSchema = Type.Union([
  RoutingDefaultSchema,
  RoutingCustomSchema,
]);

// Model schema
export const ModelSchema = Type.Object({
  alias: Type.String({ minLength: 1 }),
  LLM: Type.String({ minLength: 1 }),
  routing: RoutingSchema,
});

// Collection of models must contain at least one entry
export const ModelsSchema = Type.Array(ModelSchema, { minItems: 1 });

// -----------------------------------------------------------------------------
// Inferred Types
// -----------------------------------------------------------------------------
export type SupportedProvider = Static<typeof SupportedProviders>;
export type CustomEndpoint = Static<typeof CustomEndpointSchema>;
export type Routing = Static<typeof RoutingSchema>;
export type Model = Static<typeof ModelSchema>;
export type Models = Static<typeof ModelsSchema>;
