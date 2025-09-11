import heboCluster from "./cluster";
import heboDatabase from "./db";
import { getDomain } from "./dns";
import * as secrets from "./secrets";

const isProd = $app.stage === "production";
const apiDomain = await getDomain("api");
const apiPort = "3001";

const heboApi = new sst.aws.Service("HeboApi", {
  cluster: heboCluster,
  architecture: "arm64",
  image: {
    context: ".",
    dockerfile: "infra/stacks/docker/Dockerfile.api",
    tags: [apiDomain],
  },
  environment: {
    LOG_LEVEL: isProd ? "info" : "debug",
    NO_COLOR: "1",
    PG_DATABASE: heboDatabase.database,
    PG_HOST: heboDatabase.host,
    PG_PASSWORD: secrets.dbPassword.value,
    PG_PORT: heboDatabase.port.apply((port) => port.toString()),
    PG_USER: heboDatabase.username,
    PORT: apiPort,
    STACK_SECRET_SERVER_KEY: secrets.stackSecretServerKey.value,
    VITE_STACK_PROJECT_ID: secrets.stackProjectId.value,
  },
  loadBalancer: {
    domain: apiDomain,
    rules: [
      { listen: "80/http", redirect: "443/https" },
      { listen: "443/https", forward: `${apiPort}/http` },
    ],
  },
  scaling: {
    min: isProd ? 2 : 1,
    max: isProd ? 16 : 1,
  },
  capacity: isProd ? undefined : "spot",
  wait: isProd,
});

export default heboApi;
