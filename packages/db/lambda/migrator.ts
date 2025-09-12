import { migrate } from "drizzle-orm/node-postgres/migrator";

import { db } from "../drizzle";

import type { NodePgDatabase } from "drizzle-orm/node-postgres";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const handler = async (event: unknown) => {
  await migrate(db as unknown as NodePgDatabase, {
    migrationsFolder: "./migrations",
  });

  console.log("Migrations completed successfully.");
};
