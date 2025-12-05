import { ModelDefinition, OpenAICompatibleReasoning } from "./base";
import { COHERE_EMBED_V4 } from "./cohere";
import {
  GEMINI_2_5_FLASH_LITE_PREVIEW,
  GEMINI_2_5_FLASH_PREVIEW,
  transformReasoning as transformGeminiReasoning,
} from "./gemini";
import {
  GPT_OSS_120B,
  GPT_OSS_20B,
  transformReasoning as transformGptReasoning,
} from "./gpt";

export * from "./base";

export const SUPPORTED_MODELS: readonly ModelDefinition[] = [
  GPT_OSS_120B,
  GPT_OSS_20B,
  GEMINI_2_5_FLASH_PREVIEW,
  GEMINI_2_5_FLASH_LITE_PREVIEW,
  COHERE_EMBED_V4,
] as const;

export const MODELS_BY_TYPE: Record<string, ModelDefinition> =
  Object.fromEntries(SUPPORTED_MODELS.map((m) => [m.type, m]));

/**
 * Transform OpenAI-compatible reasoning parameters into model-specific configuration.
 */
export const getReasoningConfig = (
  modelId: string,
  params: OpenAICompatibleReasoning,
): Record<string, any> | undefined => {
  const lowerCaseModelId = modelId.toLowerCase();

  if (lowerCaseModelId.includes("gpt")) {
    return transformGptReasoning(params);
  } else if (lowerCaseModelId.includes("gemini")) {
    return transformGeminiReasoning(params);
  }
  return undefined;
};
