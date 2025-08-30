import { createClient } from "@clickhouse/client";

import { ResourceSafe, safeRead } from "../sst";

const heboClickHouse = ResourceSafe
  ? (safeRead(() => ResourceSafe.HeboClickHouse) ?? {})
  : {};

const config = {
  url:
    safeRead(() => (heboClickHouse as any).url) ??
    process.env.CLICKHOUSE_URL ??
    "http://localhost:9000",
  username:
    safeRead(() => (heboClickHouse as any).username) ??
    process.env.CLICKHOUSE_USER ??
    "hebo",
  password:
    safeRead(() => (heboClickHouse as any).password) ??
    process.env.CLICKHOUSE_PASSWORD ??
    "hebo",
  database:
    safeRead(() => (heboClickHouse as any).database) ??
    process.env.CLICKHOUSE_DB ??
    "hebo",
};

const client = createClient(config);

export default client;
