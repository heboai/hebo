import { Elysia } from "elysia";

import { createDbClient } from "@hebo/database/client";

// Note: Must be used after authService to ensure userId is set
export const dbClient = new Elysia({
  name: "db-client",
})
  .resolve((ctx) => ({
    dbClient: createDbClient((ctx as unknown as { userId: string }).userId),
  }))
  .as("scoped");
