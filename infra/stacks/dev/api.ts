// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../../.sst/platform/config.d.ts" />

import heboDatabase from "./db";
import vpc from "./vpc";

const cluster = new sst.aws.Cluster("HeboApiCluster", { vpc });

const api = new sst.aws.Service("HeboApi", {
    cluster,
    link: [heboDatabase],
    image: {
        context: "apps/api",
        dockerfile: "Dockerfile"
    },
    dev: {
        command: "tsx watch src/index.ts",
        directory: "apps/api",
        url: "http://localhost:3001"
    },
    environment: {
        SQLITE_CONNECTION_STRING: heboDatabase.properties.SQLiteConnectionString
    }
});

export default api;