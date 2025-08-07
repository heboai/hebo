import { Elysia } from "elysia";
import { authenticateUser } from "./middlewares/auth";
import { handleGetVersion } from "./api";

const PORT = parseInt(process.env.PORT ?? "3001", 10);

new Elysia()
  .get("/", () => "Hebo API says hello!")
  .use(authenticateUser)
  .guard({
    /* Ensure request is authenticated */
    beforeHandle: ({ store, set }) => {
      if (!store.userId) {
        set.status = 401;
        return "Unauthorized";
      }
    },
  })
  .group("/v1", (app) => app.get("/version", () => handleGetVersion()))
  .onError(({ error }) => {
    console.error("API Error:", error);
    return {
      error,
    };
  })
  .listen(PORT);

console.log(`🚀 Hebo API listening on port ${PORT} (Bun ${process.version})`);
