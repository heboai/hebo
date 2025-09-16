import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Resource } from "sst";

import { createDb } from "../drizzle";

import type { NodePgDatabase } from "drizzle-orm/node-postgres";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const handler = async (event: unknown) => {
  const dbUser = Resource.HeboDatabase.username;
  const dbPassword = Resource.HeboDatabase.password;
  const db = await createDb(dbUser, dbPassword);
  await migrate(db as unknown as NodePgDatabase, {
    migrationsFolder: "./migrations",
  });
  console.log("Migrations completed successfully.");
};
