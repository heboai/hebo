// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../../.sst/platform/config.d.ts" />

const heboVpc = new sst.aws.Vpc("HeboVpc", $app.stage === "production" ? {} : { bastion: true, nat: "ec2" });

export default heboVpc;