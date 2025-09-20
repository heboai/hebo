import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { Resource } from "sst";

import { agents } from "./schema/agents";
import { branches } from "./schema/branches";

const postgresSchema = {
  agents,
  branches,
};

type TxOf<D> = D extends {
  transaction: (
    fn: (tx: infer T, ...args: unknown[]) => unknown,
    ...a: unknown[]
  ) => unknown;
}
  ? T
  : never;

export const dbConnectionConfig = {
  host: Resource.HeboDatabase.host,
  port: Resource.HeboDatabase.port,
  user: Resource.HeboDatabase.username,
  password: Resource.HeboDatabase.password,
  database: Resource.HeboDatabase.database,
  ssl: process.env.IS_REMOTE === "true",
};

const pool = new Pool({ ...dbConnectionConfig });

export const db: NodePgDatabase<typeof postgresSchema> = drizzle(pool, {
  schema: postgresSchema,
});

export type Database = NodePgDatabase<typeof postgresSchema>;
export type UniversalDbClient = Database | TxOf<Database>;
