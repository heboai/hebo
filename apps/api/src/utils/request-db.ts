import { AsyncLocalStorage } from "node:async_hooks";

import { db } from "@hebo/db/drizzle";
import type { UniversalDbClient } from "@hebo/db/drizzle";

// Per-request storage of the active DB client (transaction if present)
const requestDbStorage = new AsyncLocalStorage<UniversalDbClient>();

const baseDb = db;
export const getDb = (): UniversalDbClient => {
  return requestDbStorage.getStore() ?? baseDb;
};

export const runWithRequestDb = <T>(
  client: UniversalDbClient,
  fn: () => Promise<T>,
): Promise<T> => {
  return requestDbStorage.run(client, fn);
};

export const runInRequestTransaction = <T>(
  fn: () => Promise<T>,
): Promise<T> => {
  // Usage guidance:
  // - Call at request/handler boundaries to ensure a transaction exists for the whole unit of work.
  // - If a transaction already exists in ALS, this reuses it (no nested transactions are created).
  // - Use only when multiple DB operations must be atomic; do not wrap individual queries.
  // - Always access the client via `getDb()` so calls participate in the active transaction.
  const existing = requestDbStorage.getStore();
  if (existing) return fn();
  return baseDb.transaction((tx) => runWithRequestDb(tx, fn));
};
