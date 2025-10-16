import { Elysia, status } from "elysia";

function upstreamResponse(e: unknown): Response | undefined {
  const r = (e as { response?: unknown })?.response;
  return r instanceof Response ? r : undefined;
}

export const oaiErrors = new Elysia({ name: "oai-error" })
  .onError(async ({ code, error }) => {
    // 400 in OpenAI shape
    if (code === "VALIDATION") {
      return status(400, {
        error: {
          message: error?.message ?? "Invalid request",
          type: "invalid_request_error",
          param: undefined,
          code: "validation_error",
        },
      });
    }

    // Error from AI SDK (err.response is a fetch Response)
    const res = upstreamResponse(error);
    if (res) {
      try {
        return status(res.status, (await res.json()) as { error: unknown });
      } catch {
        const text = await res.text().catch(() => "");
        return status(res.status, {
          error: {
            message: text || `Upstream error (${res.status})`,
            type: res.status >= 500 ? "server_error" : "invalid_request_error",
            param: undefined,
            code: undefined,
          },
        });
      }
    }

    return status(500, {
      error: {
        message:
          error instanceof Error ? error.message : "Internal Server Error",
        type: "server_error",
        param: undefined,
        code: "internal",
      },
    });
  })
  .as("scoped");
