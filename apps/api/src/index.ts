import { swagger } from "@elysiajs/swagger";
import { Elysia } from "elysia";

import { agentRoutes } from "./routes/agents";
import { branchRoutes } from "./routes/branches";

const parsePort = (portString: string | undefined): number => {
  const parsed = Number.parseInt(portString ?? "3001", 10);
  return Number.isNaN(parsed) ? 3001 : parsed;
};

const PORT = parsePort(process.env.PORT);

new Elysia()
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
