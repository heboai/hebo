import { sql } from "drizzle-orm";
import { text, check, type AnyPgColumn } from "drizzle-orm/pg-core";

export const slug = {
  name: text("name").notNull(),
  slug: text("slug").notNull(),
};

export const createSlugLowercaseCheck = <TTable extends { slug: AnyPgColumn }>(
  tableName: string,
  table: TTable,
) =>
  check(
    `${tableName}_slug_lowercase`,
    sql`${table.slug} = lower(${table.slug})`,
  );
