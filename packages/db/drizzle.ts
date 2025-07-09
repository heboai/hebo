import { dialect, isLocal, getDbCredentials } from "./utils";

// Drizzle imports for both dialects
import { drizzle as drizzlePostgres } from "drizzle-orm/node-postgres";
import { drizzle as drizzleSqlite } from "drizzle-orm/libsql";

// Runtime clients
import { Pool } from "pg";
import { createClient } from "@libsql/client";

// Schema imports
import * as sqliteSchema from "./schema/sqlite";
import * as postgresSchema from "./schema/postgresql";

// Union type for the DB instance to provide proper TS hints
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

// Create an intersection type that contains the shared API surface of both drivers.
// This removes the problematic union that prevented calling methods like `.select()`
// while still preserving IntelliSense for the common Drizzle query-builder methods.
type SqliteDb = LibSQLDatabase<typeof sqliteSchema>;
type PostgresDb = NodePgDatabase<typeof postgresSchema>;
export type UniversalDb = SqliteDb & PostgresDb;

// Immediately-invoked function to build the correct DB instance.
const initDb = (): UniversalDb => {
  try {
    if (isLocal) {
      // Local development – SQLite via libsql client
      try {
        const { url } = getDbCredentials() as { url: string };
        const client = createClient({ url });
        return drizzleSqlite(client, { schema: sqliteSchema }) as unknown as UniversalDb;
      } catch (error) {
        console.error("Failed to initialize SQLite database connection:", error);
        throw new Error(`SQLite connection failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // Remote/production – PostgreSQL via pg Pool
    try {
      const { host, port, user, password, database } = getDbCredentials() as {
        host: string; port: number; user: string; password: string; database: string;
      };
      const pool = new Pool({ host, port, user, password, database });
      return drizzlePostgres(pool, { schema: postgresSchema }) as unknown as UniversalDb;
    } catch (error) {
      console.error("Failed to initialize PostgreSQL database connection:", error);
      throw new Error(`PostgreSQL connection failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  } catch (error) {
    console.error("Database initialization failed:", error);
    throw new Error(`Database initialization failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// By default we expose `db` with its inferred type from `initDb()` to maintain
// type safety while allowing universal usage of the query builder regardless
// of which dialect is active at runtime.
export const db = initDb();

// Separate typed export for consumers who want strict typing without losing
// type safety globally
export const typedDb: UniversalDb = db;

export { dialect, isLocal };