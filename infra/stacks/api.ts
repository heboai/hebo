// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../.sst/platform/config.d.ts" />

import heboDatabase from "./db";
import * as secrets from "./secrets";
import { heboVpc } from "./vpc";

const isProd = $app.stage === "production";
const dockerTag = isProd ? "latest" : `${$app.stage}`;
const apiTag = `api-${dockerTag}`;
const apiDomainName = isProd ? "api.hebo.ai" : `${$app.stage}.api.hebo.ai`;
const cluster = new sst.aws.Cluster("HeboApiCluster", { vpc: heboVpc });

const heboApiService = new sst.aws.Service("HeboApiService", {
  cluster,
  architecture: "arm64",
  image: {
    context: ".",
    dockerfile: "infra/stacks/docker/Dockerfile.api",
    tags: [apiTag],
  },
  environment: {
    LOG_LEVEL: isProd ? "info" : "debug",
    NO_COLOR: "1",
    PG_DATABASE: heboDatabase.database,
    PG_HOST: heboDatabase.host,
    PG_PASSWORD: secrets.dbPassword.value,
    PG_PORT: heboDatabase.port.apply((port) => port.toString()),
    PG_USER: heboDatabase.username,
    PGSSLMODE: "require",
    PORT: "3001",
    STACK_SECRET_SERVER_KEY: secrets.stackSecretServerKey.value,
    VITE_STACK_PROJECT_ID: secrets.stackProjectId.value,
  },
  loadBalancer: {
    domain: apiDomainName,
    rules: [
      { listen: "80/http", redirect: "443/https" },
      { listen: "443/https", forward: "3001/http" },
    ],
  },
  scaling: {
    min: isProd ? 4 : 1,
    max: isProd ? 16 : 1,
  },
  capacity: isProd ? undefined : "spot",
  wait: isProd,
});

export default heboApiService;
