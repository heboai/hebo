import {
  Models,
  Model,
  validateModelsSchema,
  validateSingleModel,
  validateModelsAddition,
  type Routing,
} from "./models";

/**
 * Helper function to create a model with routing
 */
export const createModel = (
  alias: string,
  LLM: string,
  routing: Routing,
): Model => {
  return {
    alias,
    LLM,
    routing,
  };
};

/**
 * Validates the models field
 * @param models - The models data to validate
 * @returns Validated models array
 * @throws Error if validation fails
 */
export const validateModels = (models: unknown): Models => {
  return validateModelsSchema(models);
};

/**
 * Adds a new model to existing models with validation
 * @param existingModels - Current models
 * @param newModel - New model to add
 * @returns Updated models array
 * @throws Error if validation fails or model with same alias exists
 */
export const addModel = (existingModels: Models, newModel: unknown): Models => {
  return validateModelsAddition(existingModels, newModel);
};

/**
 * Updates a model by alias
 * @param existingModels - Current models
 * @param alias - Alias of the model to update
 * @param updatedModel - New model data
 * @returns Updated models array
 * @throws Error if validation fails or model not found
 */
export const updateModel = (
  existingModels: Models,
  alias: string,
  updatedModel: unknown,
): Models => {
  const validatedModel = validateSingleModel(updatedModel);

  const modelIndex = existingModels.findIndex((model) => model.alias === alias);
  if (modelIndex === -1) {
    throw new Error(`Model with alias "${alias}" not found`);
  }

  // Check if the new alias conflicts with other models (excluding the current one)
  const otherModels = existingModels.filter((_, index) => index !== modelIndex);
  const otherAliases = otherModels.map((model) => model.alias);
  if (otherAliases.includes(validatedModel.alias)) {
    throw new Error(
      `Model with alias "${validatedModel.alias}" already exists`,
    );
  }

  const updatedModels = [...existingModels];
  updatedModels[modelIndex] = validatedModel;
  return updatedModels;
};

/**
 * Removes a model by alias
 * @param existingModels - Current models
 * @param alias - Alias of the model to remove
 * @returns Updated models array
 * @throws Error if model not found or if it would leave no models
 */
export const removeModel = (existingModels: Models, alias: string): Models => {
  const modelIndex = existingModels.findIndex((model) => model.alias === alias);
  if (modelIndex === -1) {
    throw new Error(`Model with alias "${alias}" not found`);
  }

  const updatedModels = existingModels.filter(
    (_, index) => index !== modelIndex,
  );

  if (updatedModels.length === 0) {
    throw new Error("Cannot remove the last model from a branch");
  }

  return updatedModels;
};

/**
 * Gets a model by alias
 * @param existingModels - Current models
 * @param alias - Alias of the model to find
 * @returns The model if found, null otherwise
 */
export const getModel = (
  existingModels: Models,
  alias: string,
): Model | null => {
  return existingModels.find((model) => model.alias === alias) || null;
};

/**
 * Checks if a model exists by alias
 * @param existingModels - Current models
 * @param alias - Alias to check
 * @returns True if model exists, false otherwise
 */
export const hasModel = (existingModels: Models, alias: string): boolean => {
  return existingModels.some((model) => model.alias === alias);
};
