// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../.sst/platform/config.d.ts" />

import heboDatabase from "./db";
import heboSecurityGroup from "./security-group";
import heboVpc from "./vpc";

const stackProjectId = new sst.Secret("StackProjectId");
const stackSecretServerKey = new sst.Secret("StackSecretServerKey");

const heboApiConnector = new aws.apprunner.VpcConnector("HeboApiConnector", {
  subnets: heboVpc.privateSubnets,
  securityGroups: [heboSecurityGroup.id],
  vpcConnectorName:
    $app.stage === "production" ? "hebo-api" : `${$app.stage}-hebo-api`,
});

const heboApi = new aws.apprunner.Service("HeboApi", {
  serviceName: "hebo-api",
  sourceConfiguration: {
    imageRepository: {
      imageConfiguration: {
        port: "3001",
        runtimeEnvironmentVariables: {
          PG_HOST: heboDatabase.host,
          PG_PORT: heboDatabase.port.apply((port) => port.toString()),
          PG_USER: heboDatabase.username,
          PG_PASSWORD: heboDatabase.password,
          PG_DATABASE: heboDatabase.database,
          VITE_STACK_PROJECT_ID: stackProjectId.value,
          STACK_SECRET_SERVER_KEY: stackSecretServerKey.value,
        },
      },
      imageIdentifier: "public.ecr.aws/m1o3d3n5/hebo-api:latest",
      imageRepositoryType: "ECR_PUBLIC",
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

export const heboApiUrl = heboApi.serviceUrl;

export default heboApi;
