import heboApiService from "./api";
import { getDomain } from "./dns";
import heboGatewayService from "./gateway";
import * as secrets from "./secrets";

const heboConsole = new sst.aws.StaticSite("HeboConsole", {
  path: "apps/console",
  build: {
    command: "bun run build",
    output: "build/client",
  },
  domain: await getDomain("console"),
  environment: {
    VITE_API_URL: heboApiService.url,
    VITE_GATEWAY_URL: heboGatewayService.url,
    VITE_STACK_PROJECT_ID: secrets.stackProjectId.value,
    VITE_STACK_PUBLISHABLE_CLIENT_KEY: secrets.stackPublishableClientKey.value,
  },
});

export default heboConsole;
