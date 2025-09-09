// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../.sst/platform/config.d.ts" />

import heboDatabase from "./db";
import * as secrets from "./secrets";
import { heboVpc } from "./vpc";

const isProduction = $app.stage === "production";
const dockerTag = isProduction ? "latest" : `${$app.stage}`;
const gatewayTag = `gateway-${dockerTag}`;
const gatewayDomainName = isProduction
  ? "gateway.hebo.ai"
  : `${$app.stage}.gateway.hebo.ai`;
const cluster = new sst.aws.Cluster("HeboGatewayCluster", { vpc: heboVpc });

const heboGatewayService = new sst.aws.Service("HeboGatewayService", {
  cluster,
  architecture: "arm64",
  image: {
    context: ".",
    dockerfile: "infra/stacks/docker/Dockerfile.gateway",
    tags: [gatewayTag],
  },
  environment: {
    LOG_LEVEL: isProduction ? "info" : "debug",
    NO_COLOR: "1",
    PG_DATABASE: heboDatabase.database,
    PG_HOST: heboDatabase.host,
    PG_PASSWORD: secrets.dbPassword.value,
    PG_PORT: heboDatabase.port.apply((port) => port.toString()),
    PG_USER: heboDatabase.username,
    PGSSLMODE: "require",
    PORT: "3002",
    STACK_SECRET_SERVER_KEY: secrets.stackSecretServerKey.value,
    VITE_STACK_PROJECT_ID: secrets.stackProjectId.value,
  },
  loadBalancer: {
    domain: gatewayDomainName,
    rules: [
      { listen: "80/http", redirect: "443/https" },
      { listen: "443/https", forward: "3002/http" },
    ],
  },
  scaling: {
    min: isProduction ? 4 : 1,
    max: isProduction ? 16 : 1,
  },
  capacity: isProduction ? undefined : "spot",
  wait: isProduction,
});

export default heboGatewayService;
