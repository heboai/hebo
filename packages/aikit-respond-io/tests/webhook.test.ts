// eslint-disable-next-line import/no-unresolved
import { describe, test, expect, mock } from "bun:test";

import { webhook } from "../src/webhook";

const voidErrorHandler = () => {};

describe("webhook", () => {
  const signingKey = "secret";
  const validPayload = { event: "message", data: "test" };
  const body = JSON.stringify(validPayload);

  // eslint-disable-next-line no-secrets/no-secrets
  const validSignature = "UtAE5LaeNjrL33PUEQfh69YKw7UhrrkOL9tQN0+xIrI=";

  test("should return 401 if signature header is missing", async () => {
    const handler = webhook({
      signingKey,
      handle: async () => {},
      onError: voidErrorHandler,
    });
    const req = new Request("http://localhost", {
      method: "POST",
      body,
    });

    const res = await handler.fetch(req);
    expect(res.status).toBe(401);
  });

  test("should return 401 if signature invalid", async () => {
    const handler = webhook({
      signingKey,
      handle: async () => {},
      onError: voidErrorHandler,
    });
    const req = new Request("http://localhost", {
      method: "POST",
      body,
      headers: {
        "x-webhook-signature": "invalid",
      },
    });

    const res = await handler.fetch(req);
    expect(res.status).toBe(401);
  });

  test("should return 200 and call handle for valid request", async () => {
    const handleMock = mock(async (payload: any) => {
      expect(payload).toEqual(validPayload);
    });

    const handler = webhook({ signingKey, handle: handleMock });
    const req = new Request("http://localhost", {
      method: "POST",
      body,
      headers: {
        "x-webhook-signature": validSignature,
      },
    });

    const res = await handler.fetch(req);
    expect(res.status).toBe(200);

    await new Promise(setImmediate);
    expect(handleMock).toHaveBeenCalled();
  });

  test("should return 200 even if handle throws error (and call onError)", async () => {
    const error = new Error("Processing failed");
    const handleMock = mock(async () => {
      throw error;
    });
    const onErrorMock = mock((err) => {
      expect(err).toBe(error);
    });

    const handler = webhook({
      signingKey,
      handle: handleMock,
      onError: onErrorMock,
    });

    const req = new Request("http://localhost", {
      method: "POST",
      body,
      headers: {
        "x-webhook-signature": validSignature,
      },
    });

    const res = await handler.fetch(req);
    expect(res.status).toBe(200);

    await new Promise(setImmediate);
    expect(handleMock).toHaveBeenCalled();
    expect(onErrorMock).toHaveBeenCalled();
  });

  test("should wait for handle to complete if waitForCompletion is true", async () => {
    let finished = false;
    const handleMock = mock(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
      finished = true;
    });

    const handler = webhook({
      signingKey,
      handle: handleMock,
      waitForCompletion: true,
    });

    const req = new Request("http://localhost", {
      method: "POST",
      body,
      headers: {
        "x-webhook-signature": validSignature,
      },
    });

    const res = await handler.fetch(req);
    expect(res.status).toBe(200);
    expect(finished).toBe(true);
  });
});
