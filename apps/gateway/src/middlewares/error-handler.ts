import { Elysia, status } from "elysia";

import { getPrismaError } from "@hebo/database/src/errors";
import { AuthError } from "@hebo/shared-api/middlewares/auth/errors";

import { toOpenAiCompatibleError } from "~gateway/utils/converters";

import { BadRequestError } from "./providers/errors";

const upstreamRes = (e: unknown) =>
  (e as { response?: unknown })?.response instanceof Response
    ? (e as { response: Response }).response
    : undefined;

export const errorHandler = new Elysia({ name: "error-handler" })
  .onError(async ({ code, error }) => {
    if (error instanceof AuthError)
      return status(
        error.status,
        toOpenAiCompatibleError(
          error.message,
          "invalid_request_error",
          error.status === 401 ? "invalid_api_key" : "invalid_request",
        ),
      );

    // Elysia validation errors
    if (code === "VALIDATION")
      return status(
        400,
        toOpenAiCompatibleError(
          error?.message ?? "Invalid request",
          "invalid_request_error",
          "validation_error",
        ),
      );

    // Upstream errors
    const res = upstreamRes(error);
    if (res) {
      try {
        return status(
          res.status,
          (await res.clone().json()) as { error: unknown },
        );
      } catch {
        return status(
          res.status,
          toOpenAiCompatibleError(
            await res.text().catch(() => ""),
            res.status >= 500 ? "server_error" : "invalid_request_error",
          ),
        );
      }
    }

    if (error instanceof BadRequestError)
      return status(
        error.status,
        toOpenAiCompatibleError(
          error.message,
          "invalid_request_error",
          error.code,
        ),
      );

    const prismaError = getPrismaError(error);
    if (prismaError)
      return status(
        prismaError.status,
        toOpenAiCompatibleError(
          prismaError.message,
          "invalid_request_error",
          "not_found",
        ),
      );

    return status(
      500,
      toOpenAiCompatibleError(
        error instanceof Error ? error.message : "Internal Server Error",
        "server_error",
        "internal",
      ),
    );
  })
  .as("scoped");
