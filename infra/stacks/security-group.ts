// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../.sst/platform/config.d.ts" />

import heboVpc from "./vpc";

const heboSecurityGroup = new aws.ec2.SecurityGroup("HeboSecurityGroup", {
  vpcId: heboVpc.id,
  description: "Security group for App Runner VPC Connector",
  egress: [
    {
      protocol: "-1",
      fromPort: 0,
      toPort: 0,
      cidrBlocks: ["0.0.0.0/0"],
    },
  ],
});

export default heboSecurityGroup;
