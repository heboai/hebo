 
import { describe, expect, test } from "bun:test";

import { toModelMessage } from "../src/vercel-ai";
import { MessageContent } from "../src/webhook/types";

describe("toModelMessage", () => {
  test("should convert text message for user", () => {
    const content: MessageContent = { type: "text", text: "Hello" };
    const result = toModelMessage(content, "user");

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

    const result = toModelMessage(content, "user");

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

    expect(() => toModelMessage(content, "user")).toThrow(
      "Unsupported attachment type: video",
    );
  });

  test("should throw error for unsupported message type", () => {
    const content = { type: "location" } as any;

    expect(() => toModelMessage(content, "user")).toThrow(
      "Unsupported message type: location",
    );
  });

  test("should convert text message for assistant", () => {
    const content: MessageContent = { type: "text", text: "Response" };
    const result = toModelMessage(content, "assistant");

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

    expect(() => toModelMessage(content, "assistant")).toThrow(
      "Only text content is supported for role 'assistant'",
    );
  });
});
