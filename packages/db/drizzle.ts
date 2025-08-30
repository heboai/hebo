import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { getDrizzleConfig } from "./runtime-config";
import { agents } from "./schema/agents";
import { branches } from "./schema/branches";

const postgresSchema = {
  agents,
  branches,
};

const initDb = async () => {
  const drizzleConfig = getDrizzleConfig();
  const pool = new Pool(drizzleConfig.dbCredentials);

  return drizzle(pool, { schema: postgresSchema });
};

export const db = await initDb();
