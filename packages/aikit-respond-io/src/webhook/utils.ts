import * as crypto from "node:crypto";

import { SignatureVerificationError } from "./errors";

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
