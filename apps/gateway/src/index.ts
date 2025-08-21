import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { Elysia } from "elysia";

import { completions } from "~/modules/completions";
import { embeddings } from "~/modules/embeddings";
import { models } from "~/modules/models";

const PORT = Number(process.env.GATEWAY_PORT) || 3002;

const createApp = () =>
  new Elysia()
    // FUTURE make cors more strict for production
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
    .get("/", () => "🐵 Hebo AI Gateway says hello!")
    .group("/v1", (app) => app.use(completions).use(embeddings).use(models));

if (import.meta.main) {
  const app = createApp().listen(PORT);
  console.log(
    `🐵 Hebo Gateway is running at ${app.server?.hostname}:${app.server?.port}`,
  );
}
