import { Elysia, status } from "elysia";

import { AuthError } from "@hebo/shared-api/middlewares/auth/errors";

import { openAiCompatibleErrorBody } from "~gateway/utils/converters";

import { BadRequestError } from "./providers/errors";

const openAiCompatibleError = (
  message: string,
  type: "invalid_request_error" | "server_error",
  code?: string,
) => {
  return { error: openAiCompatibleErrorBody(message, type, code) };
};

const upstreamRes = (e: unknown) =>
  (e as { response?: unknown })?.response instanceof Response
    ? (e as { response: Response }).response
    : undefined;

export const errorHandler = new Elysia({ name: "error-handler" })
  .onError(async ({ code, error }) => {
    if (error instanceof AuthError)
      return status(
        error.status,
        openAiCompatibleError(
          error.message,
          "invalid_request_error",
          error.status === 401 ? "invalid_api_key" : "invalid_request",
        ),
      );

    if (code === "VALIDATION")
      return status(
        400,
        openAiCompatibleError(
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
          openAiCompatibleError(
            text || `Upstream error (${res.status})`,
            res.status >= 500 ? "server_error" : "invalid_request_error",
          ),
        );
      }
    }

    if (error instanceof BadRequestError)
      return status(
        error.status,
        openAiCompatibleError(
          error.message,
          "invalid_request_error",
          error.code,
        ),
      );

    // Prisma errors
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2025"
    )
      return status(
        404,
        openAiCompatibleError(
          "Resource not found",
          "invalid_request_error",
          "not_found",
        ),
      );

    return status(
      500,
      openAiCompatibleError(
        error instanceof Error ? error.message : "Internal Server Error",
        "server_error",
        "internal",
      ),
    );
  })
  .as("scoped");
