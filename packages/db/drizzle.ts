import {
  drizzle as drizzlePostgres,
  NodePgDatabase,
} from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { isLocal, getConnectionConfig } from "./runtime-config";
import { agents } from "./schema/agents";
import { branches } from "./schema/branches";

import type { DbCredentials } from "./runtime-config";
import type { PgliteDatabase } from "drizzle-orm/pglite";

const postgresSchema = {
  agents,
  branches,
};

type PostgresDb = NodePgDatabase<typeof postgresSchema>;
type PgliteDb = PgliteDatabase<typeof postgresSchema>;
type UniversalDb = PostgresDb | PgliteDb;
type TxOf<D> = D extends {
  transaction: (
    fn: (tx: infer T, ...args: unknown[]) => unknown,
    ...a: unknown[]
  ) => unknown;
}
  ? T
  : never;

export type CreateDbOptions = {
  user?: string;
  password?: string;
};

export const createDb = async (
  opts?: CreateDbOptions,
): Promise<UniversalDb> => {
  if (isLocal) {
    // Local development – PGLite via pglite client
    const dataDir = getConnectionConfig() as string;

    type DrizzlePgLite = (config: {
      schema: typeof postgresSchema;
      connection: { dataDir: string };
    }) => PgliteDatabase<typeof postgresSchema>;

    // Import pglite only in local development
    const { drizzle: drizzlePgLite } = (await import("drizzle-orm/pglite")) as {
      drizzle: DrizzlePgLite;
    };

    return drizzlePgLite({
      schema: postgresSchema,
      connection: { dataDir },
    });
  }

  // Remote/production – PostgreSQL via pg Pool
  const {
    host,
    port,
    user: defaultUser,
    password: defaultPassword,
    database,
  } = getConnectionConfig() as DbCredentials;
  // Use provided credentials if available, otherwise use the default credentials
  const user = opts?.user ?? defaultUser;
  const password = opts?.password ?? defaultPassword;

  const pool = new Pool({ host, port, user, password, database, ssl: true });
  return drizzlePostgres(pool, { schema: postgresSchema });
};

export type UniversalDbClient = UniversalDb | TxOf<PostgresDb> | TxOf<PgliteDb>;
