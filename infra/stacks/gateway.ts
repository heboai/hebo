// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../.sst/platform/config.d.ts" />

import heboDatabase from "./db";
import vpcConnectorSecurityGroup from "./security-group";
import heboVpc from "./vpc";

const stackProjectId = new sst.Secret("StackProjectId");
const stackSecretServerKey = new sst.Secret("StackSecretServerKey");

const heboGatewayConnector = new aws.apprunner.VpcConnector(
  "HeboGatewayConnector",
  {
    subnets: heboVpc.privateSubnets,
    securityGroups: [vpcConnectorSecurityGroup.id],
    vpcConnectorName:
      $app.stage === "production"
        ? "hebo-gateway"
        : `${$app.stage}-hebo-gateway`,
  },
);

const heboGateway = new aws.apprunner.Service("HeboGateway", {
  serviceName: "hebo-gateway",
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
      imageIdentifier: "public.ecr.aws/m1o3d3n5/hebo-gateway:latest",
      imageRepositoryType: "ECR_PUBLIC",
    },
    autoDeploymentsEnabled: false,
  },
  networkConfiguration: {
    egressConfiguration: {
      egressType: "VPC",
      vpcConnectorArn: heboGatewayConnector.arn,
    },
  },
});

export const heboGatewayUrl = heboGateway.serviceUrl;

export default heboGateway;
