// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../.sst/platform/config.d.ts" />

import heboDatabase from "./db";
import { appRunnerEcrAccessRole, ecrAuth, heboGatewayRepo } from "./ecr";
import * as secrets from "./secrets";
import { heboVpcConnector } from "./vpc";

const resourceName =
  $app.stage === "production" ? "hebo-gateway" : `${$app.stage}-hebo-gateway`;
const dockerTag = $app.stage === "production" ? "latest" : `${$app.stage}`;

const heboGatewayImage = new docker.Image("hebo-gateway-image", {
  build: {
    context: "../../",
    dockerfile: "../../infra/stacks/docker/Dockerfile.gateway",
    platform: "linux/amd64",
  },
  imageName: $interpolate`${heboGatewayRepo.repositoryUrl}:${dockerTag}`,
  registry: {
    server: heboGatewayRepo.repositoryUrl.apply((url) => {
      const parts = url.split("/");
      return parts.slice(0, -1).join("/");
    }),
    username: ecrAuth.userName,
    password: ecrAuth.password,
  },
});

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
          PG_HOST: heboDatabase.host,
          PG_PORT: heboDatabase.port.apply((port) => port.toString()),
          PG_USER: heboDatabase.username,
          PG_PASSWORD: secrets.dbPassword.value,
          PG_DATABASE: heboDatabase.database,
          VITE_STACK_PROJECT_ID: secrets.stackProjectId.value,
          STACK_SECRET_SERVER_KEY: secrets.stackSecretServerKey.value,
          GROQ_API_KEY: secrets.groqApiKey.value,
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
});

export const heboGatewayUrl = heboGateway.serviceUrl;

export default heboGateway;
