import heboApi from "./api";
import { getDomain } from "./dns";
import * as env from "./env";
import heboGateway from "./gateway";

const heboConsole = new sst.aws.StaticSite("HeboConsole", {
  path: "apps/console",
  build: {
    command: "bun run build",
    output: "build/client",
  },
  domain: await getDomain("console"),
  environment: {
    VITE_API_URL: heboApi.url,
    VITE_GATEWAY_URL: heboGateway.url,
    VITE_STACK_PROJECT_ID: env.stackProjectId,
    VITE_STACK_PUBLISHABLE_CLIENT_KEY: env.stackPublishableClientKey,
  },
});

export default heboConsole;
