import {
  DEFAULT_RATE_LIMIT,
  defineModel,
  OpenAICompatibleReasoning,
} from "./base";

export const GEMINI_2_5_FLASH_PREVIEW = defineModel({
  type: "google/gemini-2.5-flash-preview-09-2025",
  displayName: "Gemini 2.5 Flash Preview (Sep 2025)",
  family: "gemini",
  rateLimit: DEFAULT_RATE_LIMIT,
  modality: "chat",
  providers: [
    {
      vertex: "gemini-2.5-flash-preview-09-2025",
    },
  ],
});

export const GEMINI_2_5_FLASH_LITE_PREVIEW = defineModel({
  type: "google/gemini-2.5-flash-lite-preview-09-2025",
  displayName: "Gemini 2.5 Flash Lite Preview (Sep 2025)",
  family: "gemini",
  rateLimit: DEFAULT_RATE_LIMIT,
  modality: "chat",
  providers: [
    {
      vertex: "gemini-2.5-flash-lite-preview-09-2025",
    },
  ],
});

export const transformReasoning = (
  params: OpenAICompatibleReasoning,
): Record<string, any> | undefined => {
  const isReasoningActive =
    params.enabled === true ||
    (params.enabled === undefined &&
      (params.max_tokens !== undefined || params.effort !== undefined));

  if (isReasoningActive) {
    const thinkingConfig: Record<string, any> = {};

    thinkingConfig.includeThoughts =
      params.enabled !== false && params.exclude !== true;

    if (params.max_tokens === undefined) {
      switch (params.effort) {
        case "low": {
          thinkingConfig.thinkingBudget = 1024;
          break;
        }
        case "high": {
          thinkingConfig.thinkingBudget = 24_576;
          break;
        }
        default: {
          thinkingConfig.thinkingBudget = 8192;
          break;
        }
      }
    } else {
      thinkingConfig.thinkingBudget = params.max_tokens;
    }

    return {
      thinkingConfig: thinkingConfig,
    };
  }

  return undefined;
};
