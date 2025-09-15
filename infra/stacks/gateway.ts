import heboCluster from "./cluster";
import heboDatabase from "./db";
import { isProd, stackProjectId } from "./env";
import * as ssm from "./ssm";

const gatewayDomain = isProd
  ? "gateway.hebo.ai"
  : `gateway.${$app.stage}.hebo.ai`;
const gatewayPort = "3002";

const heboGateway = new sst.aws.Service("HeboGateway", {
  cluster: heboCluster,
  architecture: "arm64",
  cpu: isProd ? "1 vCPU" : "0.25 vCPU",
  image: {
    context: ".",
    dockerfile: "infra/stacks/docker/Dockerfile.gateway",
    tags: [gatewayDomain],
  },
  environment: {
    LOG_LEVEL: isProd ? "info" : "debug",
    NO_COLOR: "1",
    NODE_EXTRA_CA_CERTS: "/etc/ssl/certs/rds-bundle.pem",
    PG_DATABASE: heboDatabase.database,
    PG_HOST: heboDatabase.host,
    PG_PORT: heboDatabase.port.apply((port) => port.toString()),
    PORT: gatewayPort,
    VITE_STACK_PROJECT_ID: stackProjectId,
  },
  ssm: {
    PG_PASSWORD: ssm.dbPassword.arn,
    PG_USER: ssm.dbUsername.arn,
    STACK_SECRET_SERVER_KEY: ssm.stackSecretServerKey.arn,
    GROQ_API_KEY: ssm.groqApiKey.arn,
    VOYAGE_API_KEY: ssm.voyageApiKey.arn,
  },
  loadBalancer: {
    domain: gatewayDomain,
    rules: [
      { listen: "80/http", redirect: "443/https" },
      { listen: "443/https", forward: `${gatewayPort}/http` },
    ],
  },
  scaling: {
    min: isProd ? 2 : 1,
    max: isProd ? 16 : 1,
  },
  capacity: isProd ? undefined : "spot",
  wait: isProd,
});

export default heboGateway;
