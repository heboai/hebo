import { Elysia } from "elysia";

import { createDbClient, createDbClientPublic } from "@hebo/database/client";

// Note: Must be used after authService to ensure userId is set
export const dbClient = new Elysia({
  name: "db-client",
})
  .resolve((ctx) => ({
    dbClient: createDbClient((ctx as unknown as { userId: string }).userId),
  }))
  .as("scoped");

export const dbClientPublic = new Elysia({
  name: "db-client-public",
})
  .resolve((ctx) => ({
    dbClient: createDbClientPublic(
      (ctx as unknown as { userId: string }).userId,
    ),
  }))
  .as("scoped");
