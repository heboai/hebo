// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../.sst/platform/config.d.ts" />

import heboVpc from "./vpc";
import heboDatabase from "./db";

// Create a security group for the VPC Connector
const vpcConnectorSecurityGroup = new aws.ec2.SecurityGroup("VpcConnectorSecurityGroup", {
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

// Create a VPC Connector for App Runner to access the database inside the VPC
const heboApiConnector = new aws.apprunner.VpcConnector("HeboApiConnector", {
  subnets: heboVpc.privateSubnets,
  securityGroups: [vpcConnectorSecurityGroup.id],
  vpcConnectorName: $app.stage === "production" ? "hebo-api" : `${$app.stage}-hebo-api`,
});

const heboApi = new aws.apprunner.Service("HeboApi", {
  serviceName: "hebo-api",
  sourceConfiguration: {
    imageRepository: {
      imageConfiguration: {
        port: "3001",
        runtimeEnvironmentVariables: {
          PG_HOST: heboDatabase.host,
          PG_PORT: heboDatabase.port.apply(port => port.toString()),
          PG_USER: heboDatabase.username,
          PG_PASSWORD: heboDatabase.password,
          PG_DATABASE: heboDatabase.database,
        },
      },
      imageIdentifier: "public.ecr.aws/m1o3d3n5/hebo-api:latest",
      imageRepositoryType: "ECR_PUBLIC"
    },
    autoDeploymentsEnabled: false,
  },
  networkConfiguration: {
    egressConfiguration: {
      egressType: "VPC",
      vpcConnectorArn: heboApiConnector.arn,
    },
  },
});

// Expose the public service URL so other stacks (eg. Next.js) can consume it
export const heboApiUrl = heboApi.serviceUrl;

export default heboApi;