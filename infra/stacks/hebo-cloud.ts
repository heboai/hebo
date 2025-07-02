// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../.sst/platform/config.d.ts" />

import heboDatabase from "./db";

const heboCloudApp = new sst.aws.Nextjs("HeboCloudApp", {
  path: "apps/hebo-cloud",
  domain: "cloud.hebo.ai",
  link: [heboDatabase]
});

export default heboCloudApp;
