import { type Static } from "elysia";

import { OpenAICompatibleFinishReason } from "./openai-compatible-api-schemas";

import type { FinishReason, GenerateTextResult } from "ai";

type OpenAICompatibleFinishReason = Static<typeof OpenAICompatibleFinishReason>;

export const convertToOpenAICompatibleFinishReason = (
  finishReason: FinishReason,
): OpenAICompatibleFinishReason => {
  if (
    finishReason === "error" ||
    finishReason === "other" ||
    finishReason === "unknown"
  ) {
    return "stop";
  }
  return finishReason.replaceAll("-", "_") as OpenAICompatibleFinishReason;
};

export const convertToOpenAICompatibleMessage = (
  result: GenerateTextResult<any, any>,
) => {
  if (result.toolCalls && result.toolCalls.length > 0) {
    return {
      role: "assistant" as const,
      content: result.text,
      tool_calls: result.toolCalls.map((toolCall: any) => ({
        id: toolCall.toolCallId,
        type: "function" as const,
        function: {
          name: toolCall.toolName,
          arguments: JSON.stringify(toolCall.input),
        },
      })),
    };
  }
  return {
    role: "assistant" as const,
    content: result.text,
  };
};
