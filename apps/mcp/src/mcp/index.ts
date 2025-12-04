import { createServer } from "node:http";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";

import { countLetterTool } from "./tools/count-letter.js";

const PORT = process.env.MCP_PORT
  ? Number.parseInt(process.env.MCP_PORT, 10)
  : 3100;

 
const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

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
  if (url.pathname !== "/mcp") {
    res.writeHead(404).end("Not Found");
    return;
  }

  const body = await new Promise<unknown>((resolve) => {
    if (req.method !== "POST") return resolve();
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(data ? JSON.parse(data) : undefined));
  });

  const sessionId = req.headers["mcp-session-id"] as string | undefined;

  if (sessionId && transports[sessionId]) {
    await transports[sessionId].handleRequest(req, res, body);
    return;
  }

  if (req.method === "POST" && isInitializeRequest(body)) {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => crypto.randomUUID(),
      enableJsonResponse: true,
      onsessioninitialized: (sid) => {
        transports[sid] = transport;
      },
    });

    await createMcpServer().connect(transport);
    await transport.handleRequest(req, res, body);
    return;
  }

  res.writeHead(400).end(
    JSON.stringify({
      jsonrpc: "2.0",
      error: { code: -32_000, message: "Bad Request" },
      // eslint-disable-next-line unicorn/no-null -- JSON-RPC 2.0 spec requires null
      id: null,
    }),
  );
}).listen(PORT, () =>
  console.log(`Hebo MCP Server running on http://localhost:${PORT}/mcp`),
);
