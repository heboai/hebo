import { logger } from "@bogeychan/elysia-logger";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { Elysia } from "elysia";

import { agentsModule } from "~/modules/agents";
import { branchesModule } from "~/modules/branches";

const PORT = Number(process.env.API_PORT) || 3001;

const createApi = () =>
  new Elysia()
    .use(logger())
    // FUTURE:make cors more strict for production
    .use(cors())
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
    .get("/", () => "🚀 Hebo API says hello!")
    .group("/v1", (app) => app.use(agentsModule.use(branchesModule)));

if (import.meta.main) {
  const app = createApi().listen(PORT);
  console.log(`🚀 Hebo API running at ${app.server!.url}`);
}

export type Api = ReturnType<typeof createApi>;
