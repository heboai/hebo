import { type Static } from "elysia";

import {
  OpenAICompatibleMessage as OpenAICompatibleMessageSchema,
  OpenAICompatibleContentPartFile,
  OpenAICompatibleContentPartImage,
  OpenAICompatibleContentPartText,
} from "./openai-compatible-api-schemas";

import type { ModelMessage } from "ai";

type OpenAICompatibleMessage = Static<typeof OpenAICompatibleMessageSchema>;

type OpenAICompatibleContentPart =
  | Static<typeof OpenAICompatibleContentPartText>
  | Static<typeof OpenAICompatibleContentPartImage>
  | Static<typeof OpenAICompatibleContentPartFile>;

function convertOpenAICompatibleContentToModelContent(
  content: OpenAICompatibleContentPart[],
) {
  return content.map((part) => {
    if (part.type === "image_url") {
      const url = part.image_url.url;
      if (url.startsWith("data:")) {
        const [metadata, base64Data] = url.split(",");
        const mimeType = metadata.split(":")[1].split(";")[0];

        return mimeType.startsWith("image/")
          ? {
              type: "image" as const,
              image: Buffer.from(base64Data, "base64"),
              mediaType: mimeType,
            }
          : {
              type: "file" as const,
              data: Buffer.from(base64Data, "base64"),
              mediaType: mimeType,
            };
      }
      // It's a regular URL, we assume it's an image
      return {
        type: "image" as const,
        image: new URL(url),
      };
    }
    if (part.type === "file") {
      const { data, media_type } = part.file;
      return media_type.startsWith("image/")
        ? {
            type: "image" as const,
            image: Buffer.from(data, "base64"),
            mediaType: media_type,
          }
        : {
            type: "file" as const,
            data: Buffer.from(data, "base64"),
            mediaType: media_type,
          };
    }
    return part;
  });
}

function findToolCall(messages: OpenAICompatibleMessage[], toolCallId: string) {
  for (const message of messages) {
    if (message.role === "assistant" && message.tool_calls) {
      const toolCall = message.tool_calls.find((tc) => tc.id === toolCallId);
      if (toolCall) {
        return toolCall;
      }
    }
  }
}

function parseToolOutput(content: string) {
  try {
    return { type: "json" as const, value: JSON.parse(content) };
  } catch {
    return { type: "text" as const, value: content };
  }
}

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
            content: convertOpenAICompatibleContentToModelContent(
              message.content,
            ),
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
        const toolCall = findToolCall(messages, message.tool_call_id);

        if (!toolCall) {
          throw new Error(
            `Tool call with id '${
              message.tool_call_id
            }' not found in assistant messages.`,
          );
        }

        modelMessages.push({
          role: "tool",
          content: [
            {
              type: "tool-result",
              toolCallId: message.tool_call_id,
              toolName: toolCall.function.name,
              output: parseToolOutput(message.content as string),
            },
          ],
        });
        break;
      }
    }
  }

  return modelMessages;
}
