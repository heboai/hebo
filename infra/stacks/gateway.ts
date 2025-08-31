// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../.sst/platform/config.d.ts" />

import heboDatabase from "./db";
import appRunnerEcrAccessRole from "./iam";
import heboSecurityGroup from "./security-group";
import heboVpc from "./vpc";

const stackProjectId = new sst.Secret("StackProjectId");
const stackSecretServerKey = new sst.Secret("StackSecretServerKey");
const groqApiKey = new sst.Secret("GroqApiKey");
const voyagerApiKey = new sst.Secret("VoyagerApiKey");

const resourceName =
  $app.stage === "production" ? "hebo-gateway" : `${$app.stage}-hebo-gateway`;
const dockerTag = $app.stage === "production" ? "latest" : `${$app.stage}`;

const heboGatewayRepo = new aws.ecr.Repository(resourceName, {
  forceDelete: true,
  imageScanningConfiguration: { scanOnPush: true },
});

const ecrAuth = aws.ecr.getAuthorizationTokenOutput({});

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

const heboGatewayConnector = new aws.apprunner.VpcConnector(
  "HeboGatewayConnector",
  {
    subnets: heboVpc.privateSubnets,
    securityGroups: [heboSecurityGroup.id],
    vpcConnectorName:
      $app.stage === "production"
        ? "hebo-gateway"
        : `${$app.stage}-hebo-gateway`,
  },
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
          PG_HOST: heboDatabase.host,
          PG_PORT: heboDatabase.port.apply((port) => port.toString()),
          PG_USER: heboDatabase.username,
          PG_PASSWORD: new sst.Secret("HeboDbPassword").value,
          PG_DATABASE: heboDatabase.database,
          VITE_STACK_PROJECT_ID: stackProjectId.value,
          STACK_SECRET_SERVER_KEY: stackSecretServerKey.value,
          GROQ_API_KEY: groqApiKey.value,
          VOYAGER_API_KEY: voyagerApiKey.value,
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
      vpcConnectorArn: heboGatewayConnector.arn,
    },
  },
});

export const heboGatewayUrl = heboGateway.serviceUrl;

export default heboGateway;
