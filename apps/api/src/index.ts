import { Elysia } from "elysia";
import { authenticateUser } from "./middlewares/auth";
import { handleGetVersion } from "./api";

const PORT = parseInt(process.env.PORT ?? "3001", 10);

new Elysia()
  .get("/", () => "Hebo API says hello!")
  .use(authenticateUser)
  .group("/v1", (api) =>
    api.guard(
      {
        /* Ensure request is authenticated */
        beforeHandle: ({ store, set }) => {
          if (!store.userId) {
            set.status = 401;
            return "Unauthorized";
          }
        },
      },
      (api) => api.get("/version", () => handleGetVersion()),
    ),
  )
  .onError(({ error }) => {
    console.error("API Error:", error);
    return {
      error,
    };
  })
  .listen(PORT);

console.log(`🚀 Hebo API listening on port ${PORT} (Bun ${process.version})`);
