import { Elysia, ValidationError, NotFoundError, status } from "elysia";

import { NotFoundError as DatabaseNotFoundError } from "@hebo/database/src/errors";
import { Prisma } from "@hebo/database/src/generated/prisma/client";

// FUTURE: move to shared-api
export const errors = new Elysia({
  name: "errors",
}).onError({ as: "global" }, ({ error }) => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return status(409, "Resource already exists");
    }
    if (error.code === "P2025") {
      return status(404, "Resource not found");
    }
  }
  if (
    error instanceof NotFoundError ||
    error instanceof DatabaseNotFoundError
  ) {
    return status(404, "Resource not found");
  }
  if (error instanceof ValidationError) {
    return status(422, error.customError ?? "Invalid request body");
  }
  return status(500, "Internal Server Error");
});
