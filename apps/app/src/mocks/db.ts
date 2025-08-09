import DB from "~/mocks/_miragejs/orm/db/DB";
import type DbCollection from "~/mocks/_miragejs/orm/db/DbCollection";

type MockCollections = {
  agents: DbCollection<Record<string, unknown>, string>;
};

declare global {
  var __heboDb: DB<MockCollections> | undefined;
}

const db = globalThis.__heboDb ?? new DB<MockCollections>();
if (!globalThis.__heboDb) {
  // Initialize collections only once
  db.createCollection("agents");
  globalThis.__heboDb = db;
}

export { db };
