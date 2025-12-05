import { logger } from "@bogeychan/elysia-logger";
import tailwindPlugin from "bun-plugin-tailwind";
import { Elysia } from "elysia";
import { renderToReadableStream } from "react-dom/server";

import { aikit } from "./aikit";
import { App } from "./App";

const LOG_LEVEL = process.env.LOG_LEVEL ?? "info";
const PORT = Number(process.env.PORT ?? 3000);

/**
 * SSR HTML shell that wraps the React app with proper document structure.
 */
function Document({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" type="image/svg+xml" href="/static/logo.svg" />
        <title>Bun + React</title>
        <link rel="stylesheet" href="/static/styles.css" />
      </head>
      <body>
        <div id="root">{children}</div>
        <script type="module" src="/static/frontend.js" />
      </body>
    </html>
  );
}

// Build assets with Tailwind plugin at startup
async function buildAssets() {
  const result = await Bun.build({
    entrypoints: ["src/frontend.tsx"],
    outdir: "./dist",
    minify: process.env.NODE_ENV === "production",
    target: "browser",
    plugins: [tailwindPlugin],
  });

  if (!result.success) {
    console.error("Build failed:", result.logs);
    return;
  }

  console.log("✅ Assets built successfully");
}

await buildAssets();

const createApp = () =>
  new Elysia()
    .use(logger({ level: LOG_LEVEL }))
    .use(aikit)
    // SSR route - serves server-side rendered React app
    .get("/", async () => {
      const stream = await renderToReadableStream(
        <Document>
          <App />
        </Document>,
      );
      return new Response(stream, {
        headers: { "Content-Type": "text/html" },
      });
    })
    // Static assets from dist folder (built with Tailwind)
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
    // Static source assets
    .get("/static/logo.svg", () => Bun.file("src/logo.svg"))
    .get("/static/react.svg", () => Bun.file("src/react.svg"))
    // API routes
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
