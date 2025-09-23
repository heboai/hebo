import heboApi from "./api";
import { isProd, stackProjectId, stackPublishableClientKey } from "./env";
import heboGateway from "./gateway";

const heboConsole = new sst.aws.StaticSite("HeboConsole", {
  path: "apps/console",
  build: {
    command: "bun run build",
    output: "build/client",
  },
  domain: isProd ? "console.hebo.ai" : `console.${$app.stage}.hebo.ai`,
  environment: {
    VITE_API_URL: heboApi.url,
    VITE_GATEWAY_URL: heboGateway.url,
    VITE_STACK_PROJECT_ID: stackProjectId.value,
    VITE_STACK_PUBLISHABLE_CLIENT_KEY: stackPublishableClientKey.value,
  },
});

export default heboConsole;
