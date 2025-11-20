import { exec } from "node:child_process";
import { promisify } from "node:util";

import { connectionString } from "../client";

export const handler = async () => {
  await promisify(exec)("npx prisma@6.17.0 migrate deploy", {
    env: { ...process.env, DATABASE_URL: connectionString },
  });
  return { ok: true };
};
