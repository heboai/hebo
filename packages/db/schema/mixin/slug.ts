import { text } from "drizzle-orm/pg-core";

export const slug = ({ unique = false }: { unique?: boolean } = {}) => {
  const baseSlug = {
    name: text("name").notNull(),
    slug: text("slug").notNull(),
  };

  if (unique === true) {
    return {
      ...baseSlug,
      slug: text("slug").notNull().unique(),
    };
  }

  return baseSlug;
};
