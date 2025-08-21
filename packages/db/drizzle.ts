import {
  drizzle as drizzlePostgres,
  NodePgDatabase,
} from "drizzle-orm/node-postgres";
import { drizzle as drizzlePgLite, PgliteDatabase } from "drizzle-orm/pglite";
import { Pool } from "pg";

import { isLocal, getConnectionConfig } from "./runtime-config";
import { agents } from "./schema/agents";
import { branches } from "./schema/branches";

import type { DbCredentials } from "./runtime-config";

const postgresSchema = {
  agents,
  branches,
};

// Driver-specific DB types
export type PostgresDb = NodePgDatabase<typeof postgresSchema>;
export type PgliteDb = PgliteDatabase<typeof postgresSchema>;
export type UniversalDb = PostgresDb | PgliteDb;

// Helper to extract the tx client type from a DB type
type TxOf<D> = D extends {
  transaction: (fn: (tx: infer T, ...args: any[]) => any, ...a: any[]) => any;
}
  ? T
  : never;

// Accept top-level DB or a tx client from either driver
export type UniversalDbClient = UniversalDb | TxOf<PostgresDb> | TxOf<PgliteDb>;

// Factory function to build the correct DB instance at module init.
const initDb = (): UniversalDb => {
  if (isLocal) {
    // Local development – PGLite via pglite client
    const dataDir = getConnectionConfig() as string;

    return drizzlePgLite({
      schema: postgresSchema,
      connection: { dataDir },
    });
  }

  // Remote/production – PostgreSQL via pg Pool
  const { host, port, user, password, database } =
    getConnectionConfig() as DbCredentials;

  const pool = new Pool({ host, port, user, password, database });

  return drizzlePostgres(pool, { schema: postgresSchema });
};

// Export a properly typed db without casts
export const db: UniversalDb = initDb();
