import { Elysia, status } from "elysia";

import { AuthError } from "@hebo/shared-api/middlewares/auth/errors";

export const errorHandler = new Elysia({ name: "error-handler" })
  .onError(({ error }) => {
    if (error instanceof AuthError) {
      return status(error.status, error.message);
    }
    if (error && typeof error === "object" && "code" in error) {
      if (error.code === "P2002") {
        return status(409, "Resource already exists");
      }
      if (error.code === "P2025") {
        return status(404, "Resource not found");
      }
    }
  })
  .as("scoped");
