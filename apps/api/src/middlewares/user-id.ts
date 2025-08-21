import { Elysia } from "elysia";

// FUTURE: remove this once auth is wired in
export const userId = new Elysia({ name: "user-id" })
  .derive(() => {
    // FUTURE: Replace with real auth derived user id
    const userId = "dummy" as const;
    return { userId } as const;
  })
  .as("scoped");
