import { logger } from "@bogeychan/elysia-logger";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { Elysia } from "elysia";

import { authService } from "@hebo/shared-api/auth/auth-service";
import { corsConfig } from "@hebo/shared-api/cors/cors-config";

import { agentsModule } from "~/modules/agents";
import { branchesModule } from "~/modules/branches";

const PORT = Number(process.env.API_PORT) || 3001;

const createApi = () =>
  new Elysia()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- any needed because of typing issue in @bogyechan
    .use(logger() as any)
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
    .use(authService)
    .get("/", () => "🐵 Hebo API says hello!")
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
