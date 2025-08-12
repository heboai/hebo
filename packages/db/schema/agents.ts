import { uuid, pgTable } from "drizzle-orm/pg-core";

import { audit } from "./mixin/audit";
import { slug } from "./mixin/slug";

export const agents = pgTable("agents", {
  id: uuid("id").primaryKey().defaultRandom(),
  ...slug,
  ...audit,
});
