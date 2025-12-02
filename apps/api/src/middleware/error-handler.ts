import { Elysia, status } from "elysia";

import { identifyPrismaError } from "@hebo/database/src/errors";
import { AuthError, BadRequestError } from "@hebo/shared-api/errors";

export const errorHandler = new Elysia({ name: "error-handler" })
  .onError(({ error }) => {
    if (error instanceof AuthError || error instanceof BadRequestError) {
      return status(error.status, error.message);
    }
    const prismaError = identifyPrismaError(error);
    if (prismaError) {
      return status(prismaError.status, prismaError.message);
    }
  })
  .as("scoped");
