import { createRequire } from "module";
import { fileURLToPath } from "url";
import path from "path";
/* eslint-disable @typescript-eslint/no-explicit-any */

// ---------------------------------------------
// Safe (optional) access to `Resource` from SST.
// ---------------------------------------------

const requireModule = createRequire(import.meta.url);

// `sst` might not be installed or the code might be running outside the
// SST multiplexer.  So we attempt to synchronously require it and gracefully
// handle any failures.
let ResourceSafe: any | undefined;
try {
  ResourceSafe = requireModule("sst").Resource;
} catch {
  // Module not found or other error – treat as non-SST environment.
  ResourceSafe = undefined;
}

// Helper to safely access a nested property on the Resource proxy.  If the
// proxy throws (because the SST resource map hasn't been initialised) we catch
// the error and return undefined instead – ensuring local development doesn't
// explode.
const safeRead = <T>(fn: () => T): T | undefined => {
  try {
    return fn();
  } catch {
    return undefined;
  }
};

// Cached view of the HeboDatabase resource (if present & accessible).
const heboDb = ResourceSafe ? safeRead(() => ResourceSafe.HeboDatabase) ?? {} : {};

/**
 * Determines if the current runtime should be considered "local".
 *
 * Logic hierarchy:
 * 1. If we can safely detect an SST-provided SQLite connection string, assume
 *    we are in the SST dev environment.
 * 2. If SST isn't available, default to local.
 */
export const isLocal: boolean = (() => {
  // If an explicit PostgreSQL host env is set, assume remote.
  if (process.env.PG_HOST) return false;

  // If we detect an SST-provided Postgres host, assume remote.
  const remoteHost = safeRead(() => (heboDb as any).host);
  if (remoteHost) return false;

  // Otherwise treat as local.
  return true;
})();

/**
 * Selected Drizzle dialect based on the environment.
 */
export const dialect: "sqlite" | "postgresql" = isLocal ? "sqlite" : "postgresql";

// ---------------------------------------------------------
// Unified helper that returns the credentials for Drizzle.
// ---------------------------------------------------------

export type LocalCredentials = { url: string };
export type RemoteCredentials = {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
};

export function getDbCredentials(): LocalCredentials | RemoteCredentials {
  if (isLocal) {
    // Prefer SST-provided SQLite string, else fall back to ENV, else a file.
    const url =
      safeRead(() => (heboDb as any).SQLiteConnectionString) ??
      process.env.SQLITE_CONNECTION_STRING ??
      (() => {
        if (process.env.SQLITE_CONNECTION_STRING) return process.env.SQLITE_CONNECTION_STRING;
        // Absolute path to hebo.db residing in the same package directory as this util.
        const absPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "hebo.db");
        return `file:${absPath}`;
      })();
    return { url };
  }

  // "Remote" – PostgreSQL.  Pull from SST first, then ENV.
  return {
    host: safeRead(() => (heboDb as any).host) ?? process.env.PG_HOST ?? "localhost",
    port: safeRead(() => (heboDb as any).port) ?? Number(process.env.PG_PORT ?? 5432),
    user: safeRead(() => (heboDb as any).username) ?? process.env.PG_USER ?? "postgres",
    password: safeRead(() => (heboDb as any).password) ?? process.env.PG_PASSWORD ?? "",
    database: safeRead(() => (heboDb as any).database) ?? process.env.PG_DATABASE ?? "hebo",
  } as RemoteCredentials;
} 