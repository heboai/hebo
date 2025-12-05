import { logger } from "@bogeychan/elysia-logger";
import { Elysia } from "elysia";
import { createElement } from "react";
import { renderToString } from "react-dom/server";

import { mcpHandler } from "./aikit";
import { Home } from "./ui/root";

const LOG_LEVEL = process.env.LOG_LEVEL ?? "info";
const PORT = Number(process.env.PORT ?? 3003);

const createApp = () =>
  new Elysia()
    .use(logger({ level: LOG_LEVEL }))
    .get("/", () => {
      const html = renderToString(createElement(Home));
      return new Response(html, {
        headers: { "Content-Type": "text/html" },
      });
    })
    .group("/static", (app) =>
      app.get(
        "/styles.css",
        () =>
          new Response(Bun.file("dist/frontend.css"), {
            headers: { "Content-Type": "text/css" },
          }),
      ),
    )
    .group("/aikit", (app) =>
      app
        .get("/", () => "🐵 Hebo MCP Server says hello!")
        .post("/", async ({ request, body }) => mcpHandler(request, body)),
    );

if (import.meta.main) {
  const app = createApp().listen(PORT);
  console.log(`🐵 Hebo MCP running at ${app.server!.url}`);
}

export type McpApp = ReturnType<typeof createApp>;
