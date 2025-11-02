export type OpenAICompatibleMessage =
  | OpenAICompatibleSystemMessage
  | OpenAICompatibleUserMessage
  | OpenAICompatibleAssistantMessage
  | OpenAICompatibleToolMessage;

export interface OpenAICompatibleSystemMessage {
  role: "system";
  content: string;
}

export interface OpenAICompatibleUserMessage {
  role: "user";
  content: string | Array<OpenAICompatibleContentPart>;
}

export type OpenAICompatibleContentPart =
  | OpenAICompatibleContentPartText
  | OpenAICompatibleContentPartImage;

export interface OpenAICompatibleContentPartImage {
  type: "image_url";
  image_url: { url: string };
}

export interface OpenAICompatibleContentPartText {
  type: "text";
  text: string;
}

export interface OpenAICompatibleAssistantMessage {
  role: "assistant";
  content?: string | null;
  tool_calls?: Array<OpenAICompatibleMessageToolCall>;
}

export interface OpenAICompatibleMessageToolCall {
  type: "function";
  id: string;
  function: {
    arguments: string;
    name: string;
  };
}

export interface OpenAICompatibleToolMessage {
  role: "tool";
  content: string;
  tool_call_id: string;
}

export function convertOpenAICompatibleMessagesToModelMessages(
  messages: OpenAICompatibleMessage[],
) {
  const modelMessages = [];

  for (const message of messages) {
    // Assistant message with tool calls
    if (message.role === "assistant" && message.tool_calls) {
      modelMessages.push({
        role: "assistant",
        content: message.tool_calls.map((toolCall) => ({
          type: "tool-call",
          toolCallId: toolCall.id,
          toolName: toolCall.function.name,
          input: JSON.parse(toolCall.function.arguments),
        })),
      });
      continue;
    }

    // Tool message
    if (message.role === "tool" && message.tool_call_id) {
      const toolCall = messages
        .filter((m) => m.role === "assistant" && m.tool_calls != undefined)
        .flatMap((m) => m.tool_calls ?? [])
        .find((tc) => tc.id === message.tool_call_id);

      let output;
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
      continue;
    }

    // User message with multiple parts (e.g., text and image)
    if (Array.isArray(message.content)) {
      modelMessages.push({
        ...message,
        content: message.content.map((part: any) => {
          if (part.type === "image_url") {
            return {
              type: "image",
              image: part.image_url.url,
            };
          }
          return part;
        }),
      });
      continue;
    }

    // Other messages
    modelMessages.push(message);
  }

  return modelMessages;
}
