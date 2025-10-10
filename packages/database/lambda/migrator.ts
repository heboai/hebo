import { exec } from "node:child_process";
import { promisify } from "node:util";

import { connectionString } from "../prisma-config";

export const handler = async () => {
  await promisify(exec)("npx prisma migrate deploy", {
    env: { ...process.env, DATABASE_URL: connectionString },
  });
  return { ok: true };
};
