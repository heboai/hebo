import { Elysia } from "elysia";

import { prismaExtension } from "@hebo/database/prisma-extension";

export const dbClient = new Elysia({
  name: "db-client",
})
  .resolve((ctx) => ({
    client: prismaExtension((ctx as unknown as { userId: string }).userId),
  }))
  .as("scoped");
