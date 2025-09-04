// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../.sst/platform/config.d.ts" />

import { heboApiUrl } from "./api";
import * as secrets from "./secrets";

const heboConsole = new sst.aws.StaticSite("HeboConsole", {
  path: "apps/console",
  build: {
    command: "bun run build",
    output: "build/client",
  },
  domain:
    $app.stage === "production"
      ? "console.hebo.ai"
      : `${$app.stage}.console.hebo.ai`,
  environment: {
    VITE_API_URL: heboApiUrl,
    VITE_STACK_PROJECT_ID: secrets.stackProjectId.value,
    VITE_STACK_PUBLISHABLE_CLIENT_KEY: secrets.stackPublishableClientKey.value,
  },
});

export default heboConsole;
