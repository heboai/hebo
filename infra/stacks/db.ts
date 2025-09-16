import { isProd } from "./vars";
import * as vars from "./vars";
import { heboVpc } from "./vpc";

const globalCluster = new aws.rds.GlobalCluster("HeboDbGlobal", {
  globalClusterIdentifier: isProd ? "hebo-global" : `${$app.stage}-hebo-global`,
  engine: "aurora-postgresql",
  engineVersion: "17.5",
  storageEncrypted: true,
});

const heboDatabase = new sst.aws.Aurora("HeboDatabase", {
  engine: "postgres",
  version: "17.5",
  vpc: heboVpc,
  replicas: isProd ? 1 : 0,
  scaling: isProd
    ? { min: "0.5 ACU" }
    : { min: "0 ACU", max: "4 ACU", pauseAfter: "20 minutes" },
  username: vars.dbUsername.value,
  password: vars.dbPassword.value,
  database: "hebo",
  transform: {
    cluster: (a) => {
      a.globalClusterIdentifier = globalCluster.id;
    },
  },
});

const migrator = new sst.aws.Function("DatabaseMigrator", {
  handler: "packages/db/lambda/migrator.handler",
  vpc: heboVpc,
  // Required for reading secrets from SSM
  layers: [
    "arn:aws:lambda:us-east-1:177933569100:layer:AWS-Parameters-and-Secrets-Lambda-Extension:19",
  ],
  permissions: [
    {
      actions: ["ssm:GetParameter", "ssm:GetParameters"],
      resources: [vars.dbUsername.arn, vars.dbPassword.arn],
    },
    {
      actions: ["kms:Decrypt"],
      resources: ["*"],
    },
  ],
  copyFiles: [
    {
      from: "packages/db/migrations",
      to: "./migrations",
    },
  ],
  environment: {
    NODE_EXTRA_CA_CERTS: "/var/runtime/ca-cert.pem",
    PG_HOST: heboDatabase.host,
    PG_PASSWORD_SSM_NAME: vars.dbPassword.name,
    PG_USER_SSM_NAME: vars.dbUsername.name,
    PG_PORT: heboDatabase.port.apply((port) => port.toString()),
    PG_DATABASE: heboDatabase.database,
  },
});

if (!$dev) {
  // eslint-disable-next-line sonarjs/constructor-for-side-effects
  new aws.lambda.Invocation("DatabaseMigratorInvocation", {
    input: Date.now().toString(),
    functionName: migrator.name,
  });
}

export default heboDatabase;
