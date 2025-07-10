// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../../.sst/platform/config.d.ts" />

import heboApi from "./api";

const heboCloudApp = new sst.aws.Nextjs("HeboCloudApp", {
  path: "apps/hebo-cloud",
  link: [heboApi],
  environment: $dev ? { NEXT_PUBLIC_API_URL: "http://localhost:3001" } : { NEXT_PUBLIC_API_URL: heboApi.url },
});

export default heboCloudApp;