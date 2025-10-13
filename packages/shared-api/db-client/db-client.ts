import { Elysia } from "elysia";

import { createDbClient } from "@hebo/database/prisma-extension";

export const dbClient = new Elysia({
  name: "db-client",
})
  .resolve((ctx) => ({
    client: createDbClient((ctx as unknown as { userId: string }).userId),
  }))
  .as("scoped");
