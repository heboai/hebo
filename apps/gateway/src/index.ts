import { logger } from "@bogeychan/elysia-logger";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { Elysia } from "elysia";

import { completions } from "~/modules/completions";
import { embeddings } from "~/modules/embeddings";
import { models } from "~/modules/models";

import { oaiErrors } from "./middleware/oai-errors";

const PORT = Number(process.env.GATEWAY_PORT) || 3002;

export const createApp = () =>
  new Elysia()
    .use(logger())
    // FUTURE make cors more strict for production
    .use(cors())
    .use(
      swagger({
        documentation: {
          info: {
            title: "Hebo AI Gateway",
            version: "0.0.1",
          },
        },
      }),
    )
    .use(oaiErrors)
    .get("/", () => "🐵 Hebo AI Gateway says hello!")
    .group("/v1", (app) => app.use(completions).use(embeddings).use(models));

if (import.meta.main) {
  const app = createApp().listen(PORT);
  console.log(
    `🐵 Hebo Gateway is running at ${app.server?.hostname}:${app.server?.port}`,
  );
}
