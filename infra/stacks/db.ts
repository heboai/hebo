import { heboVpc } from "./network";
import { dbUsername, dbPassword, isProd } from "./vars";

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
  username: dbUsername.value,
  password: dbPassword.value,
  database: "hebo",
  transform: {
    cluster: (a) => {
      a.globalClusterIdentifier = globalCluster.id;
    },
  },
  dev: {
    username: "postgres",
    // eslint-disable-next-line sonarjs/no-hardcoded-passwords
    password: "password",
    database: "local",
    host: "localhost",
    port: 5432,
  },
});

if (!$dev) {
  const migrator = new sst.aws.Function("DatabaseMigrator", {
    handler: "packages/db/lambda/migrator.handler",
    vpc: heboVpc,
    link: [heboDatabase],
    copyFiles: [
      {
        from: "packages/db/migrations",
        to: "./migrations",
      },
    ],
    environment: {
      NODE_ENV: "production",
      NODE_EXTRA_CA_CERTS: "/var/runtime/ca-cert.pem",
    },
  });
  // eslint-disable-next-line sonarjs/constructor-for-side-effects
  new aws.lambda.Invocation("DatabaseMigratorInvocation", {
    input: Date.now().toString(),
    functionName: migrator.name,
  });
}
export default heboDatabase;
