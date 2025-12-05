import { logger } from "@bogeychan/elysia-logger";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import Elysia from "elysia";


import { countLetterTool } from "./tools/count-letter.js";
import { createMcpHandler } from "./utils/mcp-transport.js";

const LOG_LEVEL = process.env.LOG_LEVEL ?? "info";
const PORT = Number(process.env.PORT ?? 3100);

const createMcpServer = () => {
  const server = new McpServer({ name: "hebo-mcp", version: "0.0.1" });

  server.registerTool(
    countLetterTool.name,
    countLetterTool.config,
    countLetterTool.handler,
  );

  return server;
};

const mcpHandler = createMcpHandler({ createServer: createMcpServer });

const createApp = () =>
  new Elysia()
    .use(logger({ level: LOG_LEVEL }))
    .get("/aikit", () => "🐵 Hebo MCP Server says hello!")
    .post("/aikit", async ({ request, body }) => mcpHandler(request, body));

if (import.meta.main) {
  const app = createApp().listen(PORT);
  console.log(`🐵 Hebo MCP Server running at ${app.server!.url}aikit`);
}

export type AikitApp = ReturnType<typeof createApp>;
