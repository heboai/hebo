import {
  drizzle as drizzlePostgres,
  NodePgDatabase,
} from "drizzle-orm/node-postgres";
import { drizzle as drizzlePgLite, PgliteDatabase } from "drizzle-orm/pglite";
import { Pool } from "pg";

import { agents } from "./schema/agents";
import { branches } from "./schema/branches";
import { audits } from "./schema/mixin/audit";
import { isLocal, getConnectionConfig } from "./utils";

import type { DbCredentials } from "./utils";

const postgresSchema = {
  agents,
  branches,
  audits,
};

// Create an intersection type that contains the shared API surface of both drivers.
// This removes the problematic union that prevented calling methods like `.select()`
// while still preserving IntelliSense for the common Drizzle query-builder methods.
type PgliteDb = PgliteDatabase<typeof postgresSchema>;
type PostgresDb = NodePgDatabase<typeof postgresSchema>;
export type UniversalDb = PgliteDb & PostgresDb;

// Immediately-invoked function to build the correct DB instance.
const initDb = (): UniversalDb => {
  if (isLocal) {
    // Local development – PGLite via pglite client
    const dataDir = getConnectionConfig() as string;

    return drizzlePgLite({
      schema: postgresSchema,
      connection: { dataDir },
    }) as unknown as UniversalDb;
  }

  // Remote/production – PostgreSQL via pg Pool
  const { host, port, user, password, database } =
    getConnectionConfig() as DbCredentials;
  const pool = new Pool({ host, port, user, password, database });
  return drizzlePostgres(pool, {
    schema: postgresSchema,
  }) as unknown as UniversalDb;
};

// By default we expose `db` with its inferred type from `initDb()` to maintain
// type safety while allowing universal usage of the query builder regardless
// of which dialect is active at runtime.
export const db = initDb();

// Separate typed export for consumers who want strict typing without losing
// type safety globally
export const typedDb: UniversalDb = db;

export { isLocal } from "./utils";
