import { exec } from "node:child_process";
import { promisify } from "node:util";

import { connectionString } from "../prisma.config";

export const handler = async () => {
  console.log("Running prisma migrate deploy…");
  await promisify(exec)(
    `DATABASE_URL=${connectionString} bunx prisma migrate deploy`,
  );
  console.log("Done");
  return { ok: true };
};
