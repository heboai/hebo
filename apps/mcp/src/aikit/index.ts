import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { countLetterTool } from "./tools/count-letter.js";
import { createMcpHandler } from "./utils/mcp-transport.js";

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
