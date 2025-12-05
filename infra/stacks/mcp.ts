import heboCluster from "./cluster";
import { isProd } from "./env";

const mcpDomain = isProd ? "mcp.hebo.ai" : `mcp.${$app.stage}.hebo.ai`;
const mcpPort = "3000";

/**
 * MCP Service - Elysia server with SSR React frontend
 *
 * Serves:
 * - GET / → Server-side rendered React app
 * - /static/* → CSS, JS, and assets
 * - /api/* → API endpoints
 * - /aikit/* → AI Kit MCP endpoints (if needed separately)
 */
const heboMcp = new sst.aws.Service("HeboMcp", {
  cluster: heboCluster,
  architecture: "arm64",
  cpu: "0.25 vCPU",
  memory: "0.5 GB",
  image: {
    context: ".",
    dockerfile: "infra/docker/Dockerfile.mcp",
    tags: [mcpDomain],
  },
  environment: {
    NODE_ENV: isProd ? "production" : "development",
    LOG_LEVEL: isProd ? "info" : "debug",
    PORT: mcpPort,
  },
  loadBalancer: {
    domain: mcpDomain,
    rules: [
      { listen: "80/http", redirect: "443/https" },
      { listen: "443/https", forward: `${mcpPort}/http` },
    ],
  },
  scaling: {
    min: 1,
    max: 1,
  },
  capacity: "spot",
  wait: isProd,
});

export default heboMcp;
