// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../.sst/platform/config.d.ts" />

const username = new sst.Secret("HeboDatabaseUsername");
const password = new sst.Secret("HeboDatabasePassword");

const vpc = new sst.aws.Vpc("HeboVpc");

const global = new aws.rds.GlobalCluster("HeboDatabaseGlobal", {
    globalClusterIdentifier:
        $app.stage === "production" ? "hebo-global" : `${$app.stage}-hebo-global`,
    engine: "aurora-postgresql",
    engineVersion: "17.4",
    storageEncrypted: true,
});

const heboDatabase = new sst.aws.Aurora("HeboDatabase", {
    engine: "postgres",
    version: "17.4",
    vpc,
    replicas: 1,
    scaling:
        $app.stage === "production"
            ? {
                min: "0.5 ACU",
            }
            : {
                min: "0 ACU",
                pauseAfter: "20 minutes",
                max: "4 ACU",
            },
    username: username.value,
    password: password.value,
    database: "hebo",
    // This is needed to attach the cluster to the global-database wrapper
    transform: {
        cluster: (args) => {
            args.globalClusterIdentifier = global.id;
        },
    },
    // local-dev override
    dev: {
        host: "localhost",
        port: 5432,
        username: "postgres",
        password: "password",
        database: "hebo",
    },
});

export default heboDatabase;
