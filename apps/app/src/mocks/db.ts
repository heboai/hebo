import DB from "~/mocks/_miragejs/orm/db/DB";

declare global {
  var __heboDb: DB | undefined;
}

const db = globalThis.__heboDb ?? new DB();
if (!globalThis.__heboDb) {
  // Initialize collections only once
  db.createCollection("agents");
  globalThis.__heboDb = db;
}

export { db };
