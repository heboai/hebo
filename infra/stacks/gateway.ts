// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../.sst/platform/config.d.ts" />

import heboDatabase from "./db";
import heboPublicRegistryInfo from "./registry";
import heboSecurityGroup from "./security-group";
import heboVpc from "./vpc";

const stackProjectId = new sst.Secret("StackProjectId");
const stackSecretServerKey = new sst.Secret("StackSecretServerKey");
const GroqApiKey = new sst.Secret("GroqApiKey");
const VoyagerApiKey = new sst.Secret("VoyagerApiKey");

const heboGatewayImage = new docker.Image("hebo-gateway-image", {
  build: {
    context: "../../",
    dockerfile: "../../infra/stacks/build-service/Dockerfile.gateway",
    platform: "linux/amd64",
  },
  imageName: `public.ecr.aws/m1o3d3n5/hebo-gateway:latest`,
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
  serviceName: "hebo-gateway",
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
          GROQ_API_KEY: GroqApiKey.value,
          VOYAGER_API_KEY: VoyagerApiKey.value,
        },
      },
      imageIdentifier: heboGatewayImage.imageName,
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
