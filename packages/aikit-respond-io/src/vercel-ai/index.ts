import { ModelMessage, UserContent } from "ai";

import { MessageContent, TextContent } from "../webhook/types";

/**
 * Converts a Respond.io message content to a Vercel AI SDK ModelMessage.
 *
 * @param messageContent The content of the message from Respond.io.
 * @param role The role of the message sender.
 * @returns ModelMessage.
 */
export function toModelMessage(
  messageContent: MessageContent,
  role: "user" | "assistant",
): ModelMessage {
  if (role === "user") {
    const parts: UserContent = [];

    if (messageContent.type === "text") {
      parts.push({ type: "text", text: messageContent.text });
    } else if (messageContent.type === "attachment") {
      const attachment = messageContent.attachment;
      if (attachment.type === "image") {
        parts.push({
          type: "image",
          image: new URL(attachment.url),
        });
      } else {
        // FUTURE: Add support for other attachment types
        throw new Error(`Unsupported attachment type: ${attachment.type}`);
      }
    } else {
      // FUTURE: Add support for other message types
      throw new Error(
        `Unsupported message type: ${(messageContent as any).type}`,
      );
    }

    return {
      role: role,
      content: parts,
    };
  } else {
    // role is 'assistant'
    if (messageContent.type !== "text") {
      throw new Error(`Only text content is supported for role '${role}'`);
    }
    return {
      role: role,
      content: (messageContent as TextContent).text,
    };
  }
}
