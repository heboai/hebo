import {
  jsonSchema,
  tool,
  type FinishReason,
  type GenerateTextResult,
  type ModelMessage,
  type ToolChoice,
} from "ai";

import {
  type OpenAICompatibleAssistantMessage,
  type OpenAICompatibleContentPart,
  type OpenAICompatibleFinishReason,
  type OpenAICompatibleMessage,
  type OpenAICompatibleTool,
  type OpenAICompatibleToolChoice,
} from "./openai-compatible-api-schemas";

function convertToModelContent(content: OpenAICompatibleContentPart[]) {
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

export function toModelMessages(messages: OpenAICompatibleMessage[]) {
  const modelMessages: ModelMessage[] = [];

  for (const message of messages) {
    switch (message.role) {
      case "system": {
        modelMessages.push(message as ModelMessage);
        break;
      }
      case "user": {
        if (Array.isArray(message.content)) {
          modelMessages.push({
            role: "user",
            content: convertToModelContent(message.content),
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

export const toOpenAICompatibleFinishReason = (
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

export const toOpenAICompatibleMessage = (
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

export const toToolSet = (tools: OpenAICompatibleTool[] | undefined) => {
  if (!tools) {
    return;
  }

  const toolSet: Record<string, any> = {};
  for (const t of tools) {
    toolSet[t.function.name] = tool({
      description: t.function.description,
      inputSchema: jsonSchema(t.function.parameters as any),
    });
  }
  return toolSet;
};

export const toToolChoice = (
  toolChoice: OpenAICompatibleToolChoice | undefined,
): ToolChoice<any> | undefined => {
  if (!toolChoice) {
    return undefined;
  }

  if (
    toolChoice === "none" ||
    toolChoice === "auto" ||
    toolChoice === "required"
  ) {
    return toolChoice;
  }

  return {
    type: "tool",
    toolName: toolChoice.function.name,
  };
};
