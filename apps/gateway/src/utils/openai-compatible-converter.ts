import { type Static } from "elysia";

import {
  OpenAICompatibleAssistantMessage as OpenAICompatibleAssistantMessageSchema,
  OpenAICompatibleFinishReason as OpenAICompatibleFinishReasonSchema,
} from "./openai-compatible-api-schemas";

import type { FinishReason, GenerateTextResult } from "ai";

type OpenAICompatibleFinishReason = Static<
  typeof OpenAICompatibleFinishReasonSchema
>;
type OpenAICompatibleAssistantMessage = Static<
  typeof OpenAICompatibleAssistantMessageSchema
>;

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
): OpenAICompatibleAssistantMessage => {
  const message: OpenAICompatibleAssistantMessage = {
    role: "assistant",
    // eslint-disable-next-line unicorn/no-null
    content: null,
  };

  if (result.toolCalls && result.toolCalls.length > 0) {
    message.tool_calls = result.toolCalls.map((toolCall: any) => ({
      id: toolCall.toolCallId,
      type: "function" as const,
      function: {
        name: toolCall.toolName,
        arguments: JSON.stringify(toolCall.input),
      },
    }));
  } else {
    message.content = result.text;
  }

  if (result.reasoningText) {
    message.reasoning = result.reasoningText; // GPT-OSS
    message.reasoning_content = result.reasoningText;
  }

  return message;
};
