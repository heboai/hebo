import { factory, primaryKey, manyOf } from "@mswjs/data";

export const db = factory({
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
