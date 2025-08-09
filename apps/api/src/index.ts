import { swagger } from "@elysiajs/swagger";
import { Elysia } from "elysia";

import { agentRoutes } from "./routes/agents";
import { branchRoutes } from "./routes/branches";

const PORT = Number(process.env.PORT) || 3001;

const api = new Elysia()
  .use(
    swagger({
      documentation: {
        info: {
          title: "Hebo API",
          version: "0.0.1",
        },
      },
    }),
  )
  .get("/", () => "Hebo API says hello!")
  .group("/v1", (app) => app.use(agentRoutes).use(branchRoutes))
  .onError(({ error }) => {
    console.error("API Error:", error);
    return {
      error,
    };
  })
  .listen(PORT);

console.log(`🚀 Hebo API listening on port ${PORT} (Bun ${process.version})`);

export type Api = typeof api;
