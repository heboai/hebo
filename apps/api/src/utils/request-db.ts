import { AsyncLocalStorage } from "node:async_hooks";

import { db as baseDb } from "@hebo/db";
import type { UniversalDbClient } from "@hebo/db";

// Per-request storage of the active DB client (transaction if present)
const requestDbStorage = new AsyncLocalStorage<UniversalDbClient>();

export const getDb = (): UniversalDbClient => {
  return requestDbStorage.getStore() ?? baseDb;
};

export const runWithRequestDb = <T>(
  client: UniversalDbClient,
  fn: () => Promise<T>,
): Promise<T> => {
  return requestDbStorage.run(client, fn);
};

// Wrap a handler in a request-scoped transaction and expose it via ALS
export const withRequestTransaction = <TArgs extends unknown[], TResult>(
  handler: (...args: TArgs) => Promise<TResult>,
) => {
  return (...args: TArgs): Promise<TResult> => {
    const existingClient = requestDbStorage.getStore();
    if (existingClient) {
      return handler(...args);
    }
    return baseDb.transaction((tx) =>
      runWithRequestDb(tx, () => handler(...args)),
    );
  };
};

export const inRequestTx = <T>(fn: () => Promise<T>) =>
  withRequestTransaction(fn);
