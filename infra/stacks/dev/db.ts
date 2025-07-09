// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../../.sst/platform/config.d.ts" />

const heboDatabase = new sst.Linkable("HeboDatabase", {
  // Point to the shared SQLite database that lives in the monorepo root
  // (packages/db/hebo.db) relative to the service's working directory (apps/api).
  // This ensures both `pnpm dev` and `sst dev` reference the same DB file.
  properties: { SQLiteConnectionString: "file:../../packages/db/hebo.db" },
});

export default heboDatabase;