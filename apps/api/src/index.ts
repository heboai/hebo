import { logger } from "@bogeychan/elysia-logger";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { Elysia } from "elysia";

import { agentsModule } from "~/modules/agents";
import { branchesModule } from "~/modules/branches";

const PORT = Number(process.env.PORT) || 3001;

const corsConfig = {
  origin: (request: Request) => {
    const origin = request.headers.get("origin");
    if (!origin) return true;
    if (process.env.NODE_ENV === "development") return true;
    try {
      const { hostname } = new URL(origin);
      return hostname.endsWith(".hebo.ai");
    } catch {
      return false;
    }
  },
};

const createApi = () =>
  new Elysia()
    .use(logger())
    .use(cors(corsConfig))
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
