import { defineConfig } from "drizzle-kit";

import { dbConnectionConfig } from "./drizzle";

export default defineConfig({
  dialect: "postgresql",
  schema: [`./schema`],
  out: `./migrations`,
  dbCredentials: dbConnectionConfig,
});
