import {
  DEFAULT_RATE_LIMIT,
  defineModel,
  OpenAICompatibleReasoning,
} from "./base";

export const GPT_OSS_120B = defineModel({
  type: "openai/gpt-oss-120b",
  displayName: "OpenAI GPT OSS 120B",
  family: "gpt",
  rateLimit: DEFAULT_RATE_LIMIT,
  modality: "chat",
  providers: [
    {
      bedrock: "openai.gpt-oss-120b-1:0",
      groq: "openai/gpt-oss-120b",
    },
  ],
});

export const GPT_OSS_20B = defineModel({
  type: "openai/gpt-oss-20b",
  displayName: "OpenAI GPT OSS 20B",
  family: "gpt",
  rateLimit: DEFAULT_RATE_LIMIT,
  modality: "chat",
  providers: [
    {
      bedrock: "openai.gpt-oss-20b-1:0",
      groq: "openai/gpt-oss-20b",
    },
  ],
});

export const transformReasoning = (
  params: OpenAICompatibleReasoning,
): Record<string, any> | undefined => {
  if (params.max_tokens !== undefined) {
    throw new Error("GPT models do not support 'max_tokens' for reasoning.");
  }
  if (params.exclude !== undefined) {
    throw new Error("GPT models do not support 'exclude' for reasoning.");
  }

  const isReasoningActive =
    params.enabled === true ||
    (params.enabled === undefined && params.effort !== undefined);

  if (isReasoningActive) {
    return {
      reasoningEffort: params.effort || "medium",
    };
  }

  return undefined;
};
