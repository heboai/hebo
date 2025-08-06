import { Elysia } from "elysia";
import { authenticateUser } from "./middlewares/auth";
import { handleGetVersion } from "./api";

const PORT = parseInt(process.env.PORT ?? "3001", 10);

const app = new Elysia()
  .get("/", () => "Hebo API says hello!")
  .use(authenticateUser())
  .get("/version", () => handleGetVersion())
  .onError(({ error }) => {
    console.error("API Error:", error);
    return {
      error,
    };
  });

Bun.serve({
  port: PORT,
  fetch: app.fetch,
  development: false,
});

console.log(`🚀 Hebo API listening on port ${PORT} (Bun ${process.version})`);
