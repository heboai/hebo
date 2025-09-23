import heboVpc from "./network";

const heboCluster = new sst.aws.Cluster("HeboCluster", { vpc: heboVpc });

export default heboCluster;
