// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../.sst/platform/config.d.ts" />

import { createCnameRecords } from "./certs";
import heboDatabase from "./db";
import { appRunnerEcrAccessRole, createDockerImage } from "./ecr";
import * as secrets from "./secrets";
import { heboVpcConnector } from "./vpc";

const resourceName =
  $app.stage === "production" ? "hebo-gateway" : `${$app.stage}-hebo-gateway`;

const dockerTag = $app.stage === "production" ? "latest" : `${$app.stage}`;
const gatewayTag = `gateway-${dockerTag}`;

const heboGatewayImage = createDockerImage(
  "../../infra/stacks/docker/Dockerfile.gateway",
  gatewayTag,
);

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
          LOG_LEVEL: $app.stage === "production" ? "info" : "debug",
          GROQ_API_KEY: secrets.groqApiKey.value,
          PG_DATABASE: heboDatabase.database,
          PG_HOST: heboDatabase.host,
          PG_PASSWORD: secrets.dbPassword.value,
          PG_PORT: heboDatabase.port.apply((port) => port.toString()),
          PG_USER: heboDatabase.username,
          PGSSLMODE: "require",
          PORT: "3002",
          STACK_SECRET_SERVER_KEY: secrets.stackSecretServerKey.value,
          VITE_STACK_PROJECT_ID: secrets.stackProjectId.value,
          VOYAGE_API_KEY: secrets.voyageApiKey.value,
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
  },
});

const gatewayDomainName =
  $app.stage === "production"
    ? "gateway.hebo.ai"
    : `${$app.stage}.gateway.hebo.ai`;
const heboGatewayAssociation = new aws.apprunner.CustomDomainAssociation(
  "HeboGatewayAssociation",
  {
    domainName: gatewayDomainName,
    serviceArn: heboGateway.arn,
  },
);

createCnameRecords(gatewayDomainName, heboGatewayAssociation);

export const heboGatewayUrl = gatewayDomainName;

export default heboGateway;
