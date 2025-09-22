import { isProd } from "./env";

const heboVpc = isProd
  ? new sst.aws.Vpc("HeboVpc", { nat: "managed" })
  : sst.aws.Vpc.get("--", "vpc-0e7e8d03d2e27591e");

export default heboVpc;
