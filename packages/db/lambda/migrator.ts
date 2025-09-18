import { migrate } from "drizzle-orm/node-postgres/migrator";

import { db } from "../drizzle";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const handler = async (event: unknown) => {
  await migrate(db, {
    migrationsFolder: "./migrations",
  });
  console.log("Migrations completed successfully.");
};
