import { text, bigserial, pgTable } from "drizzle-orm/pg-core";

import { audits } from "./audits";

export const agents = pgTable("agents", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  ...audits,
});
