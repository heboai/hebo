import { Elysia, status } from "elysia";

import { Prisma } from "@hebo/database/src/generated/prisma/client";

export const prismaErrors = new Elysia({
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
});
