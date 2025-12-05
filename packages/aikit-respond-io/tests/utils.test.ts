 
import { describe, expect, test } from "bun:test";

import { InvalidSignatureError } from "../src/webhook/errors";
import { verifySignature } from "../src/webhook/utils";

describe("utils", () => {
  describe("verifySignature", () => {
    const signingKey = "secret-key";
    const body = JSON.stringify({ some: "payload" });

    test("should pass for valid signature", () => {
      // eslint-disable-next-line no-secrets/no-secrets
      const validSignature = "Bq1g+eoWPzyDxcVsyqSfJaTHxwAIVJPuJ/kAf+Ef0QA=";
      expect(() =>
        verifySignature(body, validSignature, signingKey),
      ).not.toThrow();
    });

    test("should throw InvalidSignatureError for invalid signature", () => {
      const invalidSignature = "invalid-signature";
      expect(() => verifySignature(body, invalidSignature, signingKey)).toThrow(
        InvalidSignatureError,
      );
    });

    test("should throw InvalidSignatureError for signature mismatch", () => {
      // eslint-disable-next-line no-secrets/no-secrets
      const wrongSignature = "09N+j1DbGhnqxissootoebUEkYV95b55dflLjQJ1QPc=";
      expect(() => verifySignature(body, wrongSignature, signingKey)).toThrow(
        InvalidSignatureError,
      );
    });

    test("should throw InvalidSignatureError for signature length mismatch", () => {
      // Create a signature that is base64 valid but different length
      const shortSignature = Buffer.from("short").toString("base64");
      expect(() => verifySignature(body, shortSignature, signingKey)).toThrow(
        InvalidSignatureError,
      );
    });
  });
});
