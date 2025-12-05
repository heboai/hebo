import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { countLetterTool } from "./count-letter.js";
import { createMcpHandler } from "./mcp-transport.js";

const createMcpServer = () => {
  const server = new McpServer({ name: "hebo-mcp", version: "0.0.1" });

  server.registerTool(
    countLetterTool.name,
    countLetterTool.config,
    countLetterTool.handler,
  );

  return server;
};

export const mcpHandler = createMcpHandler({ createServer: createMcpServer });
