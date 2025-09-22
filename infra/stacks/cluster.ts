import { isProd } from "./env";
import heboVpc from "./network";

const heboCluster = isProd
  ? new sst.aws.Cluster("HeboCluster", { vpc: heboVpc })
  : sst.aws.Cluster.get("HeboCluster", {
      id: "arn:aws:ecs:us-east-1:160885286799:cluster/hebo-shared-Cluster-hduoaxfe",
      vpc: heboVpc,
    });

export default heboCluster;
