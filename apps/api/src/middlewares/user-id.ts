import { Elysia } from "elysia";

/**
 * Temporary user identity injector until real auth is wired in.
 * Exposes `userId` on the request context.
 */
export const userId = new Elysia({ name: "user-id" })
  .derive(() => {
    // TODO: Replace with real auth derived user id
    const userId = "dummy" as const;
    return { userId } as const;
  })
  .as("scoped");
