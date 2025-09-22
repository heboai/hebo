import { isProd } from "./env";

export const heboVpc = isProd
  ? new sst.aws.Vpc("HeboVpc", { nat: "managed" })
  : sst.aws.Vpc.get("HeboVpc", "vpc-0f75bb58699c6defa");
