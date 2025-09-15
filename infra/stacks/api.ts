import heboCluster from "./cluster";
import heboDatabase from "./db";
import * as env from "./env";
import * as ssm from "./ssm";

const isProd = $app.stage === "production";
const apiDomain = isProd ? "api.hebo.ai" : `api.${$app.stage}.hebo.ai`;
const apiPort = "3001";

const heboApi = new sst.aws.Service("HeboApi", {
  cluster: heboCluster,
  architecture: "arm64",
  cpu: isProd ? "1 vCPU" : "0.25 vCPU",
  image: {
    context: ".",
    dockerfile: "infra/stacks/docker/Dockerfile.api",
    tags: [apiDomain],
  },
  environment: {
    LOG_LEVEL: isProd ? "info" : "debug",
    NO_COLOR: "1",
    NODE_EXTRA_CA_CERTS: "/etc/ssl/certs/rds-bundle.pem",
    PG_DATABASE: heboDatabase.database,
    PG_HOST: heboDatabase.host,
    PG_PORT: heboDatabase.port.apply((port) => port.toString()),
    PORT: apiPort,
    VITE_STACK_PROJECT_ID: env.stackProjectId,
  },
  ssm: {
    PG_PASSWORD: ssm.dbPassword.arn,
    PG_USER: ssm.dbUsername.arn,
    STACK_SECRET_SERVER_KEY: ssm.stackSecretServerKey.arn,
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
