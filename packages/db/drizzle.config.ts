import { defineConfig } from "drizzle-kit";

import { isLocal, getConnectionConfig } from "./runtime-config";

import type { DbCredentials } from "./runtime-config";

const cfg = getConnectionConfig();
const dbConfig = isLocal
  ? { driver: "pglite", dbCredentials: { url: cfg as string } }
  : { dbCredentials: cfg as DbCredentials };

export default defineConfig({
  dialect: "postgresql",
  schema: [`./schema`],
  out: `./migrations`,
  ...dbConfig,
});
