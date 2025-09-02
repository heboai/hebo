// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../.sst/platform/config.d.ts" />

import heboDatabase from "./db";
import heboSecurityGroup from "./security-group";
import heboVpc from "./vpc";
import appRunnerEcrAccessRole from "./iam";

const stackProjectId = new sst.Secret("StackProjectId");
const stackSecretServerKey = new sst.Secret("StackSecretServerKey");

const dockerTag = $app.stage === "production" ? "latest" : `${$app.stage}`;

const resourceName = $app.stage === "production" ? "hebo-api" : `${$app.stage}-hebo-api`;

const heboApiRepo = new aws.ecr.Repository(resourceName, {
  forceDelete: true,
  imageScanningConfiguration: { scanOnPush: true },
});

const ecrAuth = aws.ecr.getAuthorizationTokenOutput({});

const heboApiImage = new docker.Image("hebo-api-image", {
  build: {
    context: "../../",
    dockerfile: "../../infra/stacks/docker/Dockerfile.api",
    platform: "linux/amd64",
  },
  imageName: $interpolate`${heboApiRepo.repositoryUrl}:${dockerTag}`,
  registry: {
    server: heboApiRepo.repositoryUrl.apply(url => {
      const parts = url.split('/');
      return parts.slice(0, -1).join('/');
    }),
    username: ecrAuth.userName,
    password: ecrAuth.password,
  },
});

const heboApiConnector = new aws.apprunner.VpcConnector("HeboApiConnector", {
  subnets: heboVpc.privateSubnets,
  securityGroups: [heboSecurityGroup.id],
  vpcConnectorName:
    $app.stage === "production" ? "hebo-api" : `${$app.stage}-hebo-api`,
});

const heboApi = new aws.apprunner.Service("HeboApi", {
  serviceName: resourceName,
  sourceConfiguration: {
    authenticationConfiguration: {
      accessRoleArn: appRunnerEcrAccessRole.arn,
    },
    imageRepository: {
      imageConfiguration: {
        port: "3001",
        runtimeEnvironmentVariables: {
          PG_HOST: heboDatabase.host,
          PG_PORT: heboDatabase.port.apply((port) => port.toString()),
          PG_USER: heboDatabase.username,
          PG_PASSWORD: new sst.Secret("HeboDbPassword").value,
          PG_DATABASE: heboDatabase.database,
          VITE_STACK_PROJECT_ID: stackProjectId.value,
          STACK_SECRET_SERVER_KEY: stackSecretServerKey.value,
        },
      },
      imageIdentifier: heboApiImage.imageName,
      imageRepositoryType: "ECR",
    },
    autoDeploymentsEnabled: true,
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
