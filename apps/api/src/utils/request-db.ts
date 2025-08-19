import { AsyncLocalStorage } from "node:async_hooks";

import { db as baseDb } from "@hebo/db";
import type { UniversalDbClient } from "@hebo/db";

// Per-request storage of the active DB client (transaction if present)
const requestDbStorage = new AsyncLocalStorage<UniversalDbClient>();

export const getDb = (): UniversalDbClient => {
  return requestDbStorage.getStore() ?? baseDb;
};

export const runWithRequestDb = async <T>(
  client: UniversalDbClient,
  fn: () => Promise<T>,
): Promise<T> => {
  return await requestDbStorage.run(client, fn);
};

// Wrap a handler in a request-scoped transaction and expose it via ALS
export const withRequestTransaction = <TArgs extends any[], TResult>(
  handler: (...args: TArgs) => Promise<TResult>,
) => {
  return async (...args: TArgs): Promise<TResult> => {
    return await baseDb.transaction(async (tx) => {
      return await runWithRequestDb(tx, async () => {
        return await handler(...args);
      });
    });
  };
};
