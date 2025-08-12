import { uuid, pgTable } from "drizzle-orm/pg-core";

import { audits } from "./mixin/audit";
import { slug } from "./mixin/slug";

export const agents = pgTable("agents", {
  id: uuid("id").primaryKey().defaultRandom(),
  ...slug,
  ...audits,
});
