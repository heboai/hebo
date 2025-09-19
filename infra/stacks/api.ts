import heboCluster from "./cluster";
import heboDatabase from "./db";
import { allSecrets, isProd } from "./env";

const apiDomain = isProd ? "api.hebo.ai" : `api.${$app.stage}.hebo.ai`;
const apiPort = "3001";

const heboApi = new sst.aws.Service("HeboApi", {
  cluster: heboCluster,
  architecture: "arm64",
  cpu: isProd ? "1 vCPU" : "0.25 vCPU",
  link: [heboDatabase, ...allSecrets],
  image: {
    context: ".",
    dockerfile: "infra/stacks/docker/Dockerfile.api",
    tags: [apiDomain],
  },
  environment: {
    LOG_LEVEL: isProd ? "info" : "debug",
    NO_COLOR: "1",
    NODE_EXTRA_CA_CERTS: "/etc/ssl/certs/rds-bundle.pem",
    IS_REMOTE: $dev ? "false" : "true",
    PORT: apiPort,
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
  dev: {
    command: "bun run --filter @hebo/api dev",
    url: `http://localhost:${apiPort}`,
  },
});

export default heboApi;
