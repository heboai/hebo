import { logger } from "@bogeychan/elysia-logger";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { Elysia } from "elysia";

import { authService } from "@hebo/shared-api/auth/auth-service";
import { corsConfig } from "@hebo/shared-api/cors/cors-config";

import { oaiErrors } from "./middleware/oai-errors";
import { completions } from "./modules/completions";
import { embeddings } from "./modules/embeddings";
import { models } from "./modules/models";

const PORT = Number(process.env.GATEWAY_PORT) || 3002;

export const createApp = () =>
  new Elysia()
    .use(logger())
    .use(cors(corsConfig))
    .use(
      swagger({
        // FUTURE: document security schemes
        documentation: {
          info: {
            title: "Hebo AI Gateway",
            version: "0.0.1",
          },
        },
      }),
    )
    .use(authService)
    .use(oaiErrors)
    .get("/", () => "🐵 Hebo AI Gateway says hello!")
    .group(
      "/v1",
      {
        isSignedIn: true,
      },
      (app) => app.use(completions).use(embeddings).use(models),
    );

if (import.meta.main) {
  const app = createApp().listen(PORT);
  console.log(`🐵 Hebo Gateway running at ${app.server!.url}`);
}
