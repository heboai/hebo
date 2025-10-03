import * as crypto from "node:crypto";

import { ModelMessage, UserContent } from "ai";

import { SignatureVerificationError } from "./errors.js";
import { MessageContent, TextContent, AttachmentContent } from "./types.js";

export function verifySignature(
  body: string,
  signature: string,
  signingKey: string,
): void {
  const expectedSignature = crypto
    .createHmac("sha256", signingKey)
    .update(body)
    .digest("base64");

  if (signature !== expectedSignature) {
    throw new SignatureVerificationError("Signature mismatch.");
  }
}

/**
 * Converts a Respond.io message content to a Vercel AI SDK ModelMessage.
 *
 * @param messageContent The content of the message from Respond.io.
 * @param role The role of the message sender.
 * @returns ModelMessage.
 */
export function toAiModelMessage(
  messageContent: MessageContent,
  role: "user" | "assistant",
): ModelMessage {
  if (role === "user") {
    const parts: UserContent = [];

    if (messageContent.type === "text") {
      parts.push({ type: "text", text: (messageContent as TextContent).text });
    } else if (messageContent.type === "attachment") {
      const attachment = (messageContent as AttachmentContent).attachment;
      if (attachment.type === "image") {
        parts.push({
          type: "image",
          image: new URL(attachment.url),
        });
      } else {
        throw new Error(`Unsupported attachment type: ${attachment.type}`);
      }
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
