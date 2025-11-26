import * as crypto from "node:crypto";

import { ModelMessage, UserContent } from "ai";

import { InvalidSignatureError } from "./errors";
import { MessageContent, TextContent } from "./types";

/**
 * Verifies the signature of a webhook request using HMAC SHA256.
 * This function performs a constant-time comparison to prevent timing attacks.
 *
 * @param body The raw request body as a string.
 * @param signature The 'x-webhook-signature' header value.
 * @param signingKey The secret signing key for the webhook.
 * @throws {InvalidSignatureError} If the signature is missing, invalid, or does not match.
 */
export function verifySignature(
  body: string,
  signature: string,
  signingKey: string,
): void {
  const hmac = crypto.createHmac("sha256", signingKey);
  hmac.update(body);
  const expectedSignature = hmac.digest("base64");

  const expectedSignatureBuffer = Buffer.from(expectedSignature);
  const receivedSignatureBuffer = Buffer.from(signature);

  // Ensure buffers are the same length to prevent `timingSafeEqual` from throwing
  if (expectedSignatureBuffer.length !== receivedSignatureBuffer.length) {
    throw new InvalidSignatureError("Signature length mismatch.");
  }

  // Use a constant-time comparison to prevent timing attacks
  const signaturesMatch = crypto.timingSafeEqual(
    expectedSignatureBuffer,
    receivedSignatureBuffer,
  );

  if (!signaturesMatch) {
    throw new InvalidSignatureError("Signature mismatch.");
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
