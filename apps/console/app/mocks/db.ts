import { factory, primaryKey, manyOf } from "@mswjs/data";

const createDb = () =>
  factory({
    agent: {
      slug: primaryKey(String),
      name: String,
      branches: manyOf("branch"),
    },
    branch: {
      id: primaryKey(() => crypto.randomUUID()),
      slug: String,
      name: String,
    },
  });

type DB = ReturnType<typeof createDb>;

declare global {
  var __heboDb: DB | undefined;
}

export const db: DB = (globalThis.__heboDb ??= createDb());
