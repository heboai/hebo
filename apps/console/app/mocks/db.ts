import DB from "~/mocks/_miragejs/orm/db/DB";
import type DbCollection from "~/mocks/_miragejs/orm/db/DbCollection";

type MockCollections = Record<
  string,
  DbCollection<Record<string, unknown>, string>
>;

declare global {
  var __heboDb: DB<MockCollections> | undefined;
}

// Initialize DB only once
export const db = globalThis.__heboDb ?? new DB<MockCollections>();
