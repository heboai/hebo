import { text, bigserial, pgTable } from "drizzle-orm/pg-core";
import { timestamps } from "./timestamps";

export const agents = pgTable("agents", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  user_id: text("user_id").notNull(),
  name: text("name").notNull(),
  ...timestamps,
});
