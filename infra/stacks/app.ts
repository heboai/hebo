// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../.sst/platform/config.d.ts" />

import { heboApiUrl } from "./api";

const stackProjectId = new sst.Secret("StackProjectId");
const stackPublishableClientKey = new sst.Secret("StackPublishableClientKey");

const heboApp = new sst.aws.Nextjs("HeboApp", {
  path: "apps/app",
  domain:
    $app.stage === "production"
      ? "cloud.hebo.ai"
      : `${$app.stage}.cloud.hebo.ai`,
  environment: {
    NEXT_PUBLIC_API_URL: heboApiUrl,
    NEXT_PUBLIC_STACK_PROJECT_ID: stackProjectId.value,
    NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY: stackPublishableClientKey.value,
  },
});

export default heboApp;
