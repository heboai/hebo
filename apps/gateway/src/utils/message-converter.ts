import { OpenAICompatibleMessage } from "@ai-sdk/openai-compatible";

export function convertOpenAICompatibleMessagesToModelMessages(
  messages: OpenAICompatibleMessage[],
) {
  return messages.map((message) => {
    if (Array.isArray(message.content)) {
      return {
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
      };
    }
    return message;
  });
}
