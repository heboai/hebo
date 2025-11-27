import * as crypto from "node:crypto";

import { InvalidSignatureError } from "./errors";

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
