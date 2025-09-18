import heboCluster from "./cluster";
import heboDatabase from "./db";
import { allSecrets, isProd } from "./vars";

const gatewayDomain = isProd
  ? "gateway.hebo.ai"
  : `gateway.${$app.stage}.hebo.ai`;
const gatewayPort = "3002";

const heboGateway = new sst.aws.Service("HeboGateway", {
  cluster: heboCluster,
  architecture: "arm64",
  cpu: isProd ? "1 vCPU" : "0.25 vCPU",
  link: [heboDatabase, ...allSecrets],
  image: {
    context: ".",
    dockerfile: "infra/stacks/docker/Dockerfile.gateway",
    tags: [gatewayDomain],
  },
  environment: {
    LOG_LEVEL: isProd ? "info" : "debug",
    NO_COLOR: "1",
    NODE_ENV: $dev ? "development" : "production",
    NODE_EXTRA_CA_CERTS: "/etc/ssl/certs/rds-bundle.pem",
    PORT: gatewayPort,
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
  dev: {
    command: "bun run --filter @hebo/gateway dev",
    url: `http://localhost:${gatewayPort}`,
  },
});

export default heboGateway;
