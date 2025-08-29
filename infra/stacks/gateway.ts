// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../.sst/platform/config.d.ts" />

import heboDatabase from "./db";
import heboPublicRegistryInfo from "./registry";
import heboSecurityGroup from "./security-group";
import heboVpc from "./vpc";

const stackProjectId = new sst.Secret("StackProjectId");
const stackSecretServerKey = new sst.Secret("StackSecretServerKey");
const groqApiKey = new sst.Secret("GroqApiKey");
const voyagerApiKey = new sst.Secret("VoyagerApiKey");

const dockerTag = $app.stage === "production" ? "latest" : `${$app.stage}`;

const heboGatewayPublicRepo = new aws.ecrpublic.Repository("hebo-gateway", {
  repositoryName: "hebo-gateway",
});

const heboGatewayImage = new docker.Image("hebo-gateway-image", {
  build: {
    context: "../../",
    dockerfile: "../../infra/stacks/docker/Dockerfile.gateway",
    platform: "linux/amd64",
  },
  imageName: $interpolate`${heboGatewayPublicRepo.repositoryUri}:${dockerTag}`,
  registry: heboPublicRegistryInfo,
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
  serviceName:
    $app.stage === "production" ? "hebo-gateway" : `${$app.stage}-hebo-gateway`,
  sourceConfiguration: {
    imageRepository: {
      imageConfiguration: {
        port: "3002",
        runtimeEnvironmentVariables: {
          PG_HOST: heboDatabase.host,
          PG_PORT: heboDatabase.port.apply((port) => port.toString()),
          PG_USER: heboDatabase.username,
          PG_PASSWORD: heboDatabase.password,
          PG_DATABASE: heboDatabase.database,
          VITE_STACK_PROJECT_ID: stackProjectId.value,
          STACK_SECRET_SERVER_KEY: stackSecretServerKey.value,
          GROQ_API_KEY: groqApiKey.value,
          VOYAGER_API_KEY: voyagerApiKey.value,
        },
      },
      imageIdentifier: heboGatewayImage.repoDigest,
      imageRepositoryType: "ECR_PUBLIC",
    },
    // Public ECR does not support automatic deployments
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
