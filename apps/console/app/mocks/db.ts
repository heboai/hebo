import { factory, primaryKey, oneOf } from "@mswjs/data";

const createDb = () =>
  factory({
    agent: {
      id: primaryKey(() => crypto.randomUUID()),
      slug: String,
      name: String,
    },
    branch: {
      id: primaryKey(() => crypto.randomUUID()),
      agentId: () => crypto.randomUUID(), // Fixed: Changed from String to UUID generator
      slug: String,
      name: String,
      models: Object,
      agent: oneOf("agent"),
    },
  });

type DB = ReturnType<typeof createDb>;

declare global {
  var __heboDb: DB | undefined;
}

export const db: DB = (globalThis.__heboDb ??= createDb());
