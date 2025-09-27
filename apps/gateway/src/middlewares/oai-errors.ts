import Elysia from "elysia";

function upstreamResponse(e: unknown): Response | undefined {
  const r = (e as { response?: unknown })?.response;
  return r instanceof Response ? r : undefined;
}

export const oaiErrors = new Elysia({ name: "oai-error" }).onError(
  { as: "global" },
  async ({ code, error, set }) => {
    // 1) Validation → 400 in OpenAI shape
    if (code === "VALIDATION") {
      set.status = 400;
      return {
        error: {
          message: error?.message ?? "Invalid request",
          type: "invalid_request_error",
          param: undefined,
          code: "validation_error",
        },
      };
    }

    // 2) AI SDK upstream error (err.response is a fetch Response)
    const res = upstreamResponse(error);
    if (res) {
      set.status = res.status;

      // Try to pass through upstream JSON intact
      try {
        const ct = res.headers.get("content-type") || "";
        if (ct.includes("application/json")) {
          const json = await res.clone().json();
          if (json && typeof json === "object" && "error" in json) {
            return json as { error: unknown };
          }
        }
      } catch {
        /* ignore and fall through */
      }

      // Fallback if not JSON / wrong shape
      const text = await res.text().catch(() => "");
      return {
        error: {
          message: text || `Upstream error (${res.status})`,
          type: res.status >= 500 ? "server_error" : "invalid_request_error",
          param: undefined,
          code: undefined,
        },
      };
    }

    // 3) Local/internal error
    set.status = 500;
    return {
      error: {
        message:
          error instanceof Error ? error.message : "Internal Server Error",
        type: "server_error",
        param: undefined,
        code: "internal",
      },
    };
  },
);
