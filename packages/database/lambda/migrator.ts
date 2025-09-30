import { exec } from "node:child_process";
import { promisify } from "node:util";

import { connectionString } from "../prisma.config";

export const handler = async () => {
  // TODO: Remove this log once we have tested the migration
  console.log("Running prisma migrate deploy…");
  await promisify(exec)("bunx prisma migrate deploy", {
    env: { ...process.env, DATABASE_URL: connectionString },
  });
  console.log("Done");
  return { ok: true };
};
