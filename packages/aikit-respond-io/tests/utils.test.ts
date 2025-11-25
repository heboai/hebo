// eslint-disable-next-line import/no-unresolved
import { describe, expect, test } from "bun:test";

import { InvalidSignatureError } from "../src/webhook/errors";
import { MessageContent } from "../src/webhook/types";
import { toAiModelMessage, verifySignature } from "../src/webhook/utils";

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

  describe("toAiModelMessage", () => {
    test("should convert text message for user", () => {
      const content: MessageContent = { type: "text", text: "Hello" };
      const result = toAiModelMessage(content, "user");

      expect(result).toEqual({
        role: "user",
        content: [{ type: "text", text: "Hello" }],
      });
    });

    test("should convert image attachment for user", () => {
      const content: MessageContent = {
        type: "attachment",
        attachment: { type: "image", url: "https://example.com/image.jpg" },
      };

      const result = toAiModelMessage(content, "user");

      expect(result).toEqual({
        role: "user",
        content: [
          {
            type: "image",
            image: new URL("https://example.com/image.jpg"),
          },
        ],
      });
    });

    test("should throw error for unsupported attachment type", () => {
      const content: MessageContent = {
        type: "attachment",
        attachment: { type: "video", url: "https://example.com/video.mp4" },
      } as any;

      expect(() => toAiModelMessage(content, "user")).toThrow(
        "Unsupported attachment type: video",
      );
    });

    test("should throw error for unsupported message type", () => {
      const content = { type: "location" } as any;

      expect(() => toAiModelMessage(content, "user")).toThrow(
        "Unsupported message type: location",
      );
    });

    test("should convert text message for assistant", () => {
      const content: MessageContent = { type: "text", text: "Response" };
      const result = toAiModelMessage(content, "assistant");

      expect(result).toEqual({
        role: "assistant",
        content: "Response",
      });
    });

    test("should throw error for non-text content for assistant", () => {
      const content: MessageContent = {
        type: "attachment",
        attachment: { type: "image", url: "..." },
      } as any;

      expect(() => toAiModelMessage(content, "assistant")).toThrow(
        "Only text content is supported for role 'assistant'",
      );
    });
  });
});
