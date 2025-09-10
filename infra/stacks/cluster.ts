import { heboVpc } from "./vpc";

const heboCluster = new sst.aws.Cluster("HeboCluster", { vpc: heboVpc });

export default heboCluster;
