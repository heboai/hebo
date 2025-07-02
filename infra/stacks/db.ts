// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../.sst/platform/config.d.ts" />

const username = new sst.Secret("HeboDatabaseUsername");
const password = new sst.Secret("HeboDatabasePassword");

const vpc = new sst.aws.Vpc("HeboVpc");

const global = new aws.rds.GlobalCluster("HeboDatabaseGlobal", {
    globalClusterIdentifier: $app.stage !== "production" ? $app.stage + "-hebo-global" : "hebo-global",
    engine: "aurora-postgresql",
    engineVersion: "17.4",
    storageEncrypted: true
});

const heboDatabase = new sst.aws.Aurora("HeboDatabase", {
    engine: "postgres",
    vpc,
    scaling: $app.stage !== "production" ? {
        pauseAfter: "20 minutes"
    } : {
        min: "2 ACU"
    },
    version: "17.4",
    username: username.value,
    password: password.value,
    database: "hebo",
    transform: {
        cluster: (args) => {
            args.globalClusterIdentifier = global.id;
        }
    },
    dev: {
        host: "localhost",
        port: 5432,
        username: "postgres",
        password: "password",
        database: "hebo",
    },
});

export default heboDatabase;
