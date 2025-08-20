import { factory, primaryKey } from "@mswjs/data";

export const db = factory({
  agent: {
    slug: primaryKey(String),
    name: String,
    branches: (): string[] => [],
  },
  branch: {
    slug: primaryKey(String),
    name: String,
  },
});
