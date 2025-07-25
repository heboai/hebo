// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../.sst/platform/config.d.ts" />

import heboVpc from "./vpc";

const username = new sst.Secret("HeboDbUsername");
const password = new sst.Secret("HeboDbPassword");

// Prod / preview — Aurora Serverless v2 + Global Cluster
const global = new aws.rds.GlobalCluster("HeboDbGlobal", {
  globalClusterIdentifier:
    $app.stage === "production" ? "hebo-global" : `${$app.stage}-hebo-global`,
  engine: "aurora-postgresql",
  engineVersion: "17.5",
  storageEncrypted: true,
});

const heboDatabase = new sst.aws.Aurora("HeboDatabase", {
  engine: "postgres",
  version: "17.5",
  vpc: heboVpc,
  replicas: $app.stage === "production" ? 1 : 0,
  scaling: $app.stage === "production"
    ? { min: "0.5 ACU" }
    : { min: "0 ACU", max: "4 ACU", pauseAfter: "20 minutes" },
  username: username.value,
  password: password.value,
  database: "hebo",
  transform: { cluster: (a) => { a.globalClusterIdentifier = global.id; } },
  proxy: true,
});

export default heboDatabase;