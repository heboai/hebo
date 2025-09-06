import { migrate } from "drizzle-orm/node-postgres/migrator";

import { db } from "../drizzle";
import { isLocal } from "../runtime-config";

import type { NodePgDatabase } from "drizzle-orm/node-postgres";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const handler = async (event: unknown) => {
  if (isLocal) {
    throw new Error("Migrations must run against Postgres, not PGlite.");
  }

  await migrate(db as unknown as NodePgDatabase, {
    migrationsFolder: "./migrations",
  });

  console.log("Migrations completed successfully.");
};
