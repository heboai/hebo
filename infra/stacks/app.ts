// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../.sst/platform/config.d.ts" />

import { heboApiUrl } from "./api";

// Create SST secrets for the required environment variables
const stackProjectId = new sst.Secret("StackProjectId");
const stackPublishableClientKey = new sst.Secret("StackPublishableClientKey");
const stackSecretServerKey = new sst.Secret("StackSecretServerKey");
const posthogKey = new sst.Secret("PosthogKey", "fakeValue");
const posthogHost = new sst.Secret("PosthogHost", "fakeValue");

const heboApp = new sst.aws.Nextjs("HeboApp", {
  path: "apps/app",
  domain: $app.stage === "production" ? "cloud.hebo.ai" : `${$app.stage}.cloud.hebo.ai`,
  environment: {
    NEXT_PUBLIC_API_URL: heboApiUrl,
    NEXT_PUBLIC_STACK_PROJECT_ID: stackProjectId.value,
    NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY: stackPublishableClientKey.value,
    STACK_SECRET_SERVER_KEY: stackSecretServerKey.value,
    NEXT_PUBLIC_POSTHOG_KEY: posthogKey.value,
    NEXT_PUBLIC_POSTHOG_HOST: posthogHost.value,
  },
});

export default heboApp;