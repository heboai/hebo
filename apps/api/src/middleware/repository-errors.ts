import { Elysia } from "elysia";

import {
  ConflictError,
  DatabaseError,
  NotFoundError,
} from "@hebo/database/src/errors";

export const repositoryErrors = new Elysia({
  name: "repository-errors",
}).onError({ as: "global" }, ({ error, set }) => {
  if (error instanceof NotFoundError) {
    set.status = 404;
    return "Resource not found";
  }
  if (error instanceof ConflictError) {
    set.status = 409;
    return "Resource already exists";
  }
  if (error instanceof DatabaseError) {
    set.status = 500;
    return "Unexpected database error";
  }
  throw error;
});
