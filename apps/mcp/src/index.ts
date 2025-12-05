import { logger } from "@bogeychan/elysia-logger";
import { Elysia } from "elysia";

import { aikit } from "./aikit";
import { renderHome } from "./ui/render";

const LOG_LEVEL = process.env.LOG_LEVEL ?? "info";
const PORT = Number(process.env.PORT ?? 3000);

const createApp = () =>
  new Elysia()
    .use(logger({ level: LOG_LEVEL }))
    .use(aikit)
    .get("/", async () => {
      const stream = await renderHome();
      return new Response(stream, {
        headers: { "Content-Type": "text/html" },
      });
    })
    .get(
      "/static/styles.css",
      () =>
        new Response(Bun.file("dist/frontend.css"), {
          headers: { "Content-Type": "text/css" },
        }),
    )
    .get(
      "/static/frontend.js",
      () =>
        new Response(Bun.file("dist/frontend.js"), {
          headers: { "Content-Type": "application/javascript" },
        }),
    )
    .get("/static/*", async ({ params }) => {
      const file = Bun.file(`public/${params["*"]}`);
      const exists = await file.exists();
      return exists ? file : new Response("Not Found", { status: 404 });
    })
    .get("/api/hello", () => ({
      message: "Hello, world!",
      method: "GET",
    }))
    .put("/api/hello", () => ({
      message: "Hello, world!",
      method: "PUT",
    }))
    .get("/api/hello/:name", ({ params }) => ({
      message: `Hello, ${params.name}!`,
    }));

if (import.meta.main) {
  const app = createApp().listen(PORT);
  console.log(`🐵 Hebo MCP running at ${app.server!.url}`);
}

export type McpApp = ReturnType<typeof createApp>;
