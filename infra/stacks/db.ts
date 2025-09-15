import { isProd } from "./env";
import * as ssm from "./ssm";
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
  username: ssm.dbUsername.value,
  password: ssm.dbPassword.value,
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
  copyFiles: [
    {
      from: "packages/db/migrations",
      to: "./migrations",
    },
  ],
  environment: {
    NODE_EXTRA_CA_CERTS: "/var/runtime/ca-cert.pem",
    PG_HOST: heboDatabase.host,
    PG_PASSWORD: ssm.dbPassword.value,
    PG_PORT: heboDatabase.port.apply((port) => port.toString()),
    PG_USER: ssm.dbUsername.value,
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
