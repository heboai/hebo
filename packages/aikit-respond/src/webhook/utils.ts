import crypto from "node:crypto";

import { SignatureVerificationError } from "./errors";

export function verifySignature(
  body: string,
  signature: string | null | undefined,
  signingKey: string,
): void {
  if (!signature) {
    throw new SignatureVerificationError(
      "Missing signature header (x-webhook-signature).",
    );
  }

  const expectedSignature = crypto
    .createHmac("sha256", signingKey)
    .update(body)
    .digest("base64");

  if (signature !== expectedSignature) {
    throw new SignatureVerificationError("Signature mismatch.");
  }
}
