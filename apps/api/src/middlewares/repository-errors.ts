import { Elysia, status } from "elysia";

import {
  ConflictError,
  DatabaseError,
  NotFoundError,
} from "@hebo/database/src/errors";

export const repositoryErrors = new Elysia({
  name: "repository-errors",
}).onError({ as: "global" }, ({ error }) => {
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
