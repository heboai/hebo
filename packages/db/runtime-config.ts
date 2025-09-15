import path from "node:path";
import { fileURLToPath } from "node:url";

export const isLocal: boolean = !(
  process.env.PG_HOST && process.env.PG_HOST.trim().length > 0
);

export type DbCredentials = {
  host: string;
  port: number;
  user?: string;
  password?: string;
  database: string;
};

export function getConnectionConfig(): DbCredentials | string {
  if (isLocal) {
    // dev-only guard for compiled binaries / prod runs
    if (import.meta.url.startsWith("file:///$bunfs")) {
      // Bun single-file executables run code from a virtual FS (/$bunfs).
      // PGlite and its data dir are not meant for this context.
      throw new Error(
        "[DB] PGlite is dev-only. The compiled binary is running under /$bunfs.\n" +
          "Use Postgres in compiled/prod builds or run with `bun --hot` in dev.",
      );
    }
    // Prefer explicit env var; otherwise resolve to a stable path next to this package
    // so every consumer (apps/api, scripts, etc.) points to the same DB file.
    if (process.env.PGLITE_PATH) return process.env.PGLITE_PATH;

    // Resolve to the package root (packages/db) regardless of running from src or dist
    const moduleDir = fileURLToPath(new URL(".", import.meta.url));
    const isDistBuild = path.basename(moduleDir) === "dist";
    const pkgDir = isDistBuild ? path.resolve(moduleDir, "..") : moduleDir;
    return path.resolve(pkgDir, "hebo.db");
  }

  return {
    host: process.env.PG_HOST!,
    port: Number(process.env.PG_PORT!),
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    database: process.env.PG_DATABASE!,
  };
}
