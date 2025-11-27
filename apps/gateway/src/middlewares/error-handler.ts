import { Elysia, status } from "elysia";

import { AuthError } from "@hebo/shared-api/middlewares/auth/errors";

import { BadRequestError } from "./providers/errors";

type ErrorType = "invalid_request_error" | "server_error";

const oaiErr = (msg: string, type: ErrorType, code?: string) => ({
  error: { message: msg, type, param: undefined, code },
});

const upstreamRes = (e: unknown) =>
  (e as { response?: unknown })?.response instanceof Response
    ? (e as { response: Response }).response
    : undefined;

export const errorHandler = new Elysia({ name: "error-handler" })
  .onError(async ({ code, error }) => {
    if (error instanceof AuthError)
      return status(
        error.status,
        oaiErr(
          error.message,
          "invalid_request_error",
          error.status === 401 ? "invalid_api_key" : "invalid_request",
        ),
      );

    if (code === "VALIDATION")
      return status(
        400,
        oaiErr(
          error?.message ?? "Invalid request",
          "invalid_request_error",
          "validation_error",
        ),
      );

    const res = upstreamRes(error);
    if (res) {
      try {
        return status(res.status, (await res.json()) as { error: unknown });
      } catch {
        const text = await res.text().catch(() => "");
        return status(
          res.status,
          oaiErr(
            text || `Upstream error (${res.status})`,
            res.status >= 500 ? "server_error" : "invalid_request_error",
          ),
        );
      }
    }

    if (error instanceof BadRequestError)
      return status(error.status, { error: error.toJSON() });

    // Prisma errors
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2025"
    )
      return status(
        404,
        oaiErr("Resource not found", "invalid_request_error", "not_found"),
      );

    return status(
      500,
      oaiErr(
        error instanceof Error ? error.message : "Internal Server Error",
        "server_error",
        "internal",
      ),
    );
  })
  .as("scoped");
