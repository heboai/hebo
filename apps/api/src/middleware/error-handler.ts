import { Elysia, status } from "elysia";

import { getPrismaError } from "@hebo/database/src/errors";
import { AuthError } from "@hebo/shared-api/middlewares/auth/errors";

export const errorHandler = new Elysia({ name: "error-handler" })
  .onError(({ error }) => {
    if (error instanceof AuthError) {
      return status(error.status, error.message);
    }
    const prismaError = getPrismaError(error);
    if (prismaError) {
      return status(prismaError.status, prismaError.message);
    }
  })
  .as("scoped");
