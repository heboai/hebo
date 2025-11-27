import { exec } from "node:child_process";
import { promisify } from "node:util";

import { connectionString } from "../client";

export const handler = async () => {
  // FUTURE: remove when we upgrade to Prisma 7
  // npx defaults to the latest Prisma (currently v7), but v7 changed the migrate
  // command semantics and breaks this lambda, so we pin to the v6 CLI.
  await promisify(exec)("npx prisma@6 migrate deploy", {
    env: { ...process.env, DATABASE_URL: connectionString },
  });
  return { ok: true };
};
