import { z } from "zod";

// Supported providers enum
export const SupportedProviders = z.enum([
  "openai",
  "anthropic",
  "google",
  "azure",
  "aws",
  "cohere",
  "mistral",
  "perplexity",
  "custom",
]);

// Custom endpoint schema
export const CustomEndpointSchema = z.object({
  url: z.url(),
  provider: SupportedProviders,
  apiKey: z.string().min(1),
  headers: z.record(z.string(), z.string()).optional(),
});

// Routing schema with three types: cheapest, fastest, or custom
export const RoutingSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("cheapest"),
  }),
  z.object({
    type: z.literal("fastest"),
  }),
  z.object({
    // When using custom, you must provide a customEndpoint
    type: z.literal("custom"),
    customEndpoint: CustomEndpointSchema,
  }),
]);

// Individual model schema
export const ModelSchema = z.object({
  alias: z.string().min(1),
  LLM: z.string().min(1),
  routing: RoutingSchema,
});

// Models array schema
export const ModelsSchema = z.array(ModelSchema).min(1);

// Type exports for use in other parts of the application
export type SupportedProvider = z.infer<typeof SupportedProviders>;
export type CustomEndpoint = z.infer<typeof CustomEndpointSchema>;
export type Routing = z.infer<typeof RoutingSchema>;
export type Model = z.infer<typeof ModelSchema>;
export type Models = z.infer<typeof ModelsSchema>;

// Validation functions
export const validateModelsSchema = (data: unknown): Models => {
  return ModelsSchema.parse(data);
};

export const validateSingleModel = (data: unknown): Model => {
  return ModelSchema.parse(data);
};

export const validateModelsAddition = (
  existingModels: Models,
  newModel: unknown,
): Models => {
  const validatedNewModel = validateSingleModel(newModel);

  // Check for duplicate aliases
  const existingAliases = existingModels.map((model) => model.alias);
  if (existingAliases.includes(validatedNewModel.alias)) {
    throw new Error(
      `Model with alias "${validatedNewModel.alias}" already exists`,
    );
  }

  return [...existingModels, validatedNewModel];
};
