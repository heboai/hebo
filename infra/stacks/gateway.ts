// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../.sst/platform/config.d.ts" />

import heboDatabase from "./db";
import { appRunnerEcrAccessRole, defineServiceImage } from "./ecr";
import * as secrets from "./secrets";
import { heboVpcConnector } from "./vpc";

const resourceName =
  $app.stage === "production" ? "hebo-gateway" : `${$app.stage}-hebo-gateway`;

const heboGatewayImage = defineServiceImage("gateway");

const heboGateway = new aws.apprunner.Service("HeboGateway", {
  serviceName: resourceName,
  sourceConfiguration: {
    authenticationConfiguration: {
      accessRoleArn: appRunnerEcrAccessRole.arn,
    },
    imageRepository: {
      imageConfiguration: {
        port: "3002",
        runtimeEnvironmentVariables: {
          GROQ_API_KEY: secrets.groqApiKey.value,
          PG_DATABASE: heboDatabase.database,
          PG_HOST: heboDatabase.host,
          PG_PASSWORD: secrets.dbPassword.value,
          PG_PORT: heboDatabase.port.apply((port) => port.toString()),
          PG_USER: heboDatabase.username,
          PORT: "3002",
          STACK_SECRET_SERVER_KEY: secrets.stackSecretServerKey.value,
          VITE_STACK_PROJECT_ID: secrets.stackProjectId.value,
          VOYAGER_API_KEY: secrets.voyagerApiKey.value,
        },
      },
      imageIdentifier: heboGatewayImage.imageName,
      imageRepositoryType: "ECR",
    },
    autoDeploymentsEnabled: true,
  },
  networkConfiguration: {
    egressConfiguration: {
      egressType: "VPC",
      vpcConnectorArn: heboVpcConnector.arn,
    },
  },
  healthCheckConfiguration: {
    protocol: "HTTP",
    path: "/health",
    interval: 10,
    timeout: 5,
    healthyThreshold: 1,
    unhealthyThreshold: 3,
  },
});

export const heboGatewayUrl = heboGateway.serviceUrl;

export default heboGateway;
