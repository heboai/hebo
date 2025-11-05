import { type Static } from "elysia";

import {
  OpenAICompatibleAssistantMessage as OpenAICompatibleAssistantMessageSchema,
  OpenAICompatibleMessage as OpenAICompatibleMessageSchema,
} from "./openai-compatible-api-schemas";

import type { ModelMessage } from "ai";

type OpenAICompatibleMessage = Static<typeof OpenAICompatibleMessageSchema>;
type OpenAICompatibleAssistantMessage = Static<
  typeof OpenAICompatibleAssistantMessageSchema
>;

export function convertOpenAICompatibleMessagesToModelMessages(
  messages: OpenAICompatibleMessage[],
) {
  const modelMessages: ModelMessage[] = [];

  for (const message of messages) {
    switch (message.role) {
      case "system": {
        modelMessages.push(message);
        break;
      }
      case "user": {
        if (Array.isArray(message.content)) {
          modelMessages.push({
            role: "user",
            content: message.content.map((part) => {
              if (part.type === "image_url") {
                return {
                  type: "image",
                  image: new URL(part.image_url.url),
                };
              }
              return part;
            }),
          });
        } else {
          modelMessages.push(message as ModelMessage);
        }
        break;
      }
      case "assistant": {
        if (message.tool_calls) {
          modelMessages.push({
            role: "assistant",
            content: message.tool_calls.map((toolCall) => ({
              type: "tool-call",
              toolCallId: toolCall.id,
              toolName: toolCall.function.name,
              input: JSON.parse(toolCall.function.arguments),
            })),
          });
        } else {
          modelMessages.push(message as ModelMessage);
        }
        break;
      }
      case "tool": {
        const toolCall = messages
          .filter(
            (m): m is OpenAICompatibleAssistantMessage =>
              m.role === "assistant" && m.tool_calls != undefined,
          )
          .flatMap((m) => m.tool_calls ?? [])
          .find((tc) => tc.id === message.tool_call_id);

        let output:
          | { type: "json"; value: any }
          | { type: "text"; value: string };
        try {
          const parsedContent = JSON.parse(message.content as string);
          output = { type: "json", value: parsedContent };
        } catch {
          output = { type: "text", value: message.content as string };
        }

        modelMessages.push({
          role: "tool",
          content: [
            {
              type: "tool-result",
              toolCallId: message.tool_call_id,
              toolName: toolCall?.function.name ?? "",
              output,
            },
          ],
        });
        break;
      }
    }
  }

  return modelMessages;
}
