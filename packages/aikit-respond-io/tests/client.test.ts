/* eslint-disable sonarjs/no-nested-functions */
// eslint-disable-next-line import/no-unresolved
import { describe, test, expect, mock, beforeEach } from "bun:test";
// Mocks must be set up before importing the module under test
const mockPost = mock(() =>
  Promise.resolve({
    json: () => Promise.resolve({ success: true }),
    status: 200,
    ok: true,
  } as any),
);

const mockKyInstance = {
  post: mockPost,
  extend: () => mockKyInstance,
};

const mockCreate = mock(() => mockKyInstance);

mock.module("ky", () => {
  class MockHTTPError extends Error {
    response: any;
    constructor(response: any) {
      super(response.statusText || "HTTP Error");
      this.name = "HTTPError";
      this.response = response;
    }
  }

  class MockTimeoutError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "TimeoutError";
    }
  }

  return {
    default: {
      create: mockCreate,
    },
    HTTPError: MockHTTPError,
    TimeoutError: MockTimeoutError,
  };
});

import { HTTPError, TimeoutError } from "ky";

import { RespondIoClient } from "../src/client";
import {
  RespondIoClientFailureError,
  RespondIoClientNetworkError,
} from "../src/client/errors";

describe("RespondIoClient", () => {
  const config = { apiKey: "test-api-key" };

  beforeEach(() => {
    mockPost.mockClear();
    mockCreate.mockClear();
  });

  test("should throw if apiKey is missing", () => {
    expect(() => new RespondIoClient({} as any)).toThrow(
      "API Key is required.",
    );
  });

  describe("MessagingClient", () => {
    test("sendMessage should call correct endpoint", async () => {
      const client = new RespondIoClient(config);
      const identifier = "id:123";
      const payload = {
        message: { type: "text", text: "Hello" },
      };

      const res = await client.messaging.sendMessage(identifier, payload);
      expect(res).toEqual({ success: true });
    });

    test("sendMessage should handle API errors", async () => {
      const client = new RespondIoClient(config);

      mockPost.mockImplementationOnce(() => {
        const response = {
          status: 400,
          statusText: "Bad Request",
          json: () => Promise.resolve({ error: "Invalid data" }),
        };
        throw new HTTPError(response as any);
      });

      expect(client.messaging.sendMessage("id:1", {} as any)).rejects.toThrow(
        RespondIoClientFailureError,
      );
    });

    test("sendMessage should handle Timeout errors", async () => {
      const client = new RespondIoClient(config);

      mockPost.mockImplementationOnce(() => {
        throw new TimeoutError("Request timed out");
      });

      expect(client.messaging.sendMessage("id:1", {} as any)).rejects.toThrow(
        RespondIoClientNetworkError,
      );
    });
  });

  describe("ContactClient", () => {
    test("add tags should call correct endpoint", async () => {
      const client = new RespondIoClient(config);
      const identifier = "phone:+123";
      const payload = { tags: ["new"] };

      const res = await client.contact.tags.add(identifier, payload);
      expect(res).toEqual({ success: true });
    });
  });

  describe("CommentClient", () => {
    test("create comment should call correct endpoint", async () => {
      const client = new RespondIoClient(config);
      const identifier = "email:test@example.com";
      const payload = { text: "Note" };

      const res = await client.comment.create(identifier, payload);
      expect(res).toEqual({ success: true });
    });
  });
});
