import { text } from "drizzle-orm/pg-core";

export const slug = {
  name: text("name").notNull(),
  slug: text("slug").notNull(),
};
