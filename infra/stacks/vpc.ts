// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../.sst/platform/config.d.ts" />

export const heboVpc = new sst.aws.Vpc("HeboVpc", {
  nat: "ec2",
  bastion: $app.stage !== "production",
});
