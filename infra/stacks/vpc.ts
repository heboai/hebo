// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../.sst/platform/config.d.ts" />

export const heboVpc = new sst.aws.Vpc("HeboVpc", {
  nat: "ec2",
  bastion: $app.stage !== "production",
});

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

export const heboVpcConnector = new aws.apprunner.VpcConnector(
  "HeboVpcConnector",
  {
    subnets: heboVpc.privateSubnets,
    securityGroups: [heboSecurityGroup.id],
    vpcConnectorName:
      $app.stage === "production"
        ? "hebo-vpc-connector"
        : `${$app.stage}-hebo-vpc-connector`,
  },
);
