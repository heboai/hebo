// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../../.sst/platform/config.d.ts" />

import heboVpc from "./vpc";
import heboDatabase from "./db";

new sst.aws.Function("GetVersion", {
  handler: "apps/api/api.handler",
  link: [heboDatabase],
  vpc: heboVpc,
}); 