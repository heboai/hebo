import { Elysia, ValidationError, status } from "elysia";

import {
  ConflictError,
  DatabaseError,
  NotFoundError,
} from "@hebo/database/src/errors";

// FUTURE: move to shared-api
export const errors = new Elysia({
  name: "errors",
}).onError({ as: "global" }, ({ error }) => {
  if (error instanceof ValidationError) {
    return status(422, error.customError ?? "Invalid request body");
  }
  if (error instanceof NotFoundError) {
    return status(404, "Resource not found");
  }
  if (error instanceof ConflictError) {
    return status(409, "Resource already exists");
  }
  if (error instanceof DatabaseError) {
    return status(500, "Unexpected database error");
  }
  throw error;
});
