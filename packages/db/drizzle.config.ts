import { defineConfig } from "drizzle-kit";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { dialect, getDbCredentials } from "./utils";

const dbCredentials = getDbCredentials() as any;

export default defineConfig({
    dialect,
    schema: [`./schema/${dialect}/**/*.sql.ts`],
    out: `./migrations/${dialect}`,
    dbCredentials,
});