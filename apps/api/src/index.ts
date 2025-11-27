import { logger } from "@bogeychan/elysia-logger";
import { cors } from "@elysiajs/cors";
import { openapi } from "@elysiajs/openapi";
import Elysia from "elysia";

import { authService } from "@hebo/shared-api/middlewares/auth/auth-service";
import { corsConfig } from "@hebo/shared-api/middlewares/cors-config";
import { prismaErrors } from "@hebo/shared-api/middlewares/prisma-errors";

import { agentsModule } from "./modules/agents";
import { branchesModule } from "./modules/branches";
import { providersModule } from "./modules/providers";

const LOG_LEVEL = process.env.LOG_LEVEL ?? "info";
const PORT = Number(process.env.PORT ?? 3001);

const createApi = () =>
  new Elysia()
    .use(logger({ level: LOG_LEVEL }))
    // Root route ("/") is unauthenticated and unprotected for health checks.
    .get("/", () => "🐵 Hebo API says hello!")
    .use(cors(corsConfig))
    .use(
      openapi({
        // FUTURE: document security schemes
        documentation: {
          info: {
            title: "Hebo API",
            version: "0.0.1",
          },
        },
      }),
    )
    .use(authService)
    .use(prismaErrors)
    .group(
      "/v1",
      {
        isSignedIn: true,
      },
      (app) =>
        app
          // /agents and /agents/:agentSlug/branches
          .use(agentsModule.use(branchesModule))
          // /providers
          .use(providersModule),
    );

if (import.meta.main) {
  const app = createApi().listen(PORT);
  console.log(`🐵 Hebo API running at ${app.server!.url}`);
}

export type Api = ReturnType<typeof createApi>;
