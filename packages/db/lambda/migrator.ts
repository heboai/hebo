import { migrate } from "drizzle-orm/node-postgres/migrator";

import { createDb } from "../drizzle";

import type { NodePgDatabase } from "drizzle-orm/node-postgres";

const SSM_PORT = process.env.PARAMETERS_SECRETS_EXTENSION_HTTP_PORT || "2773";
const SSM_BASE = `http://localhost:${SSM_PORT}`;

async function getParam(name: string) {
  const res = await fetch(
    `${SSM_BASE}/systemsmanager/parameters/get?name=${encodeURIComponent(name)}&withDecryption=true`,
    {
      headers: {
        "X-Aws-Parameters-Secrets-Token": process.env.AWS_SESSION_TOKEN!,
      },
    },
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`SSM getParam failed (${res.status}): ${body}`);
  }
  const json = (await res.json()) as { Parameter: { Value: string } };
  return json.Parameter.Value;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const handler = async (event: unknown) => {
  const [dbUser, dbPassword] = await Promise.all([
    getParam(process.env.PG_USER_SSM_NAME!),
    getParam(process.env.PG_PASSWORD_SSM_NAME!),
  ]);
  const db = await createDb(dbUser, dbPassword);
  await migrate(db as unknown as NodePgDatabase, {
    migrationsFolder: "./migrations",
  });
  console.log("Migrations completed successfully.");
};
