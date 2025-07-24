import { createRequire } from "module";
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

// ---------------------------------------------------------
// Unified helper that returns the config for Drizzle.
// ---------------------------------------------------------

export type DbCredentials = {
  host: string
  port: number
  user: string
  password: string
  database: string
}
export type LocalConfig = {
  driver: string,
  dbCredentials: {
    url: string
  }
};
export type RemoteConfig = {
  dbCredentials: DbCredentials
};

export function getDrizzleConfig(): LocalConfig | RemoteConfig {
  const connectionConfig = getConnectionConfig();

  if (isLocal) {
    return { driver: "pglite", dbCredentials: { url: (connectionConfig as string) } } as LocalConfig;
  }

  return {
    dbCredentials: {
      ...(connectionConfig as DbCredentials)
    }
  } as RemoteConfig;
}

export function getConnectionConfig(): DbCredentials | string {
  if (isLocal) {
    return process.env.PGLITE_PATH ?? "./hebo.db"
  }

  // "Remote" – PostgreSQL.  Pull from SST first, then ENV.
  return {
    host: safeRead(() => (heboDb as any).host) ?? process.env.PG_HOST ?? "localhost",
    port: safeRead(() => (heboDb as any).port) ?? Number(process.env.PG_PORT ?? 5432),
    user: safeRead(() => (heboDb as any).username) ?? process.env.PG_USER ?? "postgres",
    password: safeRead(() => (heboDb as any).password) ?? process.env.PG_PASSWORD ?? "",
    database: safeRead(() => (heboDb as any).database) ?? process.env.PG_DATABASE ?? "hebo",
  }
}
