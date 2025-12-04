import { createServer } from "node:http";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

import { logger } from "./logger.js";
import { countLetterTool } from "./tools/count-letter.js";

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

createServer(async (req, res) => {
  const url = new URL(req.url || "", `http://localhost:${PORT}`);

  if (url.pathname !== "/aikit") {
    logger.error({ path: url.pathname }, "Not found");
    res.writeHead(404).end("Not Found");
    return;
  }

  if (req.method === "GET") {
    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("🐵 Hebo MCP Server says hello!");
    return;
  }

  if (req.method !== "POST") {
    logger.error({ method: req.method }, "Method not allowed");
    res.writeHead(405).end("Method Not Allowed");
    return;
  }

  const body = await new Promise<unknown>((resolve) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(data ? JSON.parse(data) : undefined));
  });

  const server = createMcpServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // Stateless: no session management
  });

  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, body);

    res.on("close", () => {
      transport.close();
      server.close();
    });
  } catch (error) {
    logger.error({ error }, "Error handling MCP request");
    if (!res.headersSent) {
      res.writeHead(500).end(
        JSON.stringify({
          jsonrpc: "2.0",
          // JSON-RPC 2.0 error codes: https://www.jsonrpc.org/specification#error_object
          error: { code: -32_603, message: "Internal server error" },
          // eslint-disable-next-line unicorn/no-null -- JSON-RPC 2.0 spec requires null
          id: null,
        }),
      );
    }
  }
}).listen(PORT, () =>
  logger.info(`🐵 Hebo MCP Server running at http://localhost:${PORT}/aikit`),
);
