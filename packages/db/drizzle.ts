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
  host: (() => {
    try {
      return Resource.HeboDatabase.host;
    } catch {
      return "localhost";
    }
  })(),
  port: (() => {
    try {
      return Resource.HeboDatabase.port;
    } catch {
      return 5432;
    }
  })(),
  user: (() => {
    try {
      return Resource.HeboDatabase.username;
    } catch {
      return "postgres";
    }
  })(),
  password: (() => {
    try {
      return Resource.HeboDatabase.password;
    } catch {
      return "password";
    }
  })(),
  database: (() => {
    try {
      return Resource.HeboDatabase.database;
    } catch {
      return "local";
    }
  })(),
  ssl: process.env.IS_REMOTE === "true",
};

const pool = new Pool({ ...dbConnectionConfig });

export const db: NodePgDatabase<typeof postgresSchema> = drizzle(pool, {
  schema: postgresSchema,
});

export type Database = NodePgDatabase<typeof postgresSchema>;
export type UniversalDbClient = Database | TxOf<Database>;
