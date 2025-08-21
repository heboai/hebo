import { Elysia, status } from "elysia";

import { authenticateUser } from "@hebo/shared-auth";

export const userId = new Elysia({ name: "user-id" })
  .use(authenticateUser())
  .derive(({ userId }) => {
    if (!userId) throw status(401, "Unauthorized");
    return { userId };
  })
  .as("scoped");
