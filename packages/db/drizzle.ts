import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { getSSTResource } from "@hebo/shared-utils/sst/resource";

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
  host: getSSTResource("HeboDatabase", "host", "localhost"),
  port: getSSTResource("HeboDatabase", "port", 5432),
  user: getSSTResource("HeboDatabase", "username", "postgres"),
  password: getSSTResource("HeboDatabase", "password", "password"),
  database: getSSTResource("HeboDatabase", "database", "local"),
  ssl: process.env.IS_REMOTE === "true",
};

const pool = new Pool({ ...dbConnectionConfig });

export const db: NodePgDatabase<typeof postgresSchema> = drizzle(pool, {
  schema: postgresSchema,
});

export type Database = NodePgDatabase<typeof postgresSchema>;
export type UniversalDbClient = Database | TxOf<Database>;
