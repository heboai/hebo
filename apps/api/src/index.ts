import { logger } from "@bogeychan/elysia-logger";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import Elysia from "elysia";

import { authService } from "@hebo/shared-api/auth/auth-service";
import { corsConfig } from "@hebo/shared-api/cors/cors-config";
import { prismaErrors } from "@hebo/shared-api/middlewares/prisma-errors";

import { agentsModule } from "./modules/agents";
import { branchesModule } from "./modules/branches";

const LOG_LEVEL = process.env.LOG_LEVEL ?? "info";
const PORT = Number(process.env.PORT ?? 3001);

const createApi = () =>
  new Elysia()
    .use(logger({ level: LOG_LEVEL }))
    // Root route ("/") is unauthenticated and unprotected for health checks.
    .get("/", () => "🐵 Hebo API says hello!")
    .use(cors(corsConfig))
    .use(
      swagger({
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
      (app) => app.use(agentsModule.use(branchesModule)),
    );

if (import.meta.main) {
  const app = createApi().listen(PORT);
  console.log(`🐵 Hebo API running at ${app.server!.url}`);
}

export type Api = ReturnType<typeof createApi>;
