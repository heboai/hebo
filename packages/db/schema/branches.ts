import { isNull } from "drizzle-orm";
import {
  text,
  bigserial,
  pgTable,
  jsonb,
  uniqueIndex,
  bigint,
} from "drizzle-orm/pg-core";

import { agents } from "./agents";
import { timestamps } from "./timestamps";
import { Models } from "./types/models";

export const branches = pgTable(
  "branches",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    agent_id: bigint("agent_id", { mode: "number" })
      .notNull()
      .references(() => agents.id, { onDelete: "cascade" }),
    name: text("name").notNull().default("main"),
    models: jsonb("models").$type<Models>().notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("branches_agent_id_name_unique_index")
      .on(table.agent_id, table.name)
      .where(isNull(table.deleted_at)),
  ],
);
