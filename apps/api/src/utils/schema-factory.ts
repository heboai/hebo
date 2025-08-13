import { createSchemaFactory } from "drizzle-typebox";
import { t } from "elysia";

import type { Table } from "drizzle-orm";

// Define common fields to omit
const commonOmittedKeys = [
  "id",
  "slug",
  "createdBy",
  "createdAt",
  "updatedBy",
  "updatedAt",
  "deletedBy",
  "deletedAt",
] as const;

export const { createInsertSchema, createUpdateSchema } = createSchemaFactory({
  typeboxInstance: t,
});

export const createCustomInsertSchema = (
  table: Table,
  extraKeys: readonly string[] = [],
) => {
  const schema = createInsertSchema(table);
  return t.Omit(schema, [...commonOmittedKeys, ...extraKeys]);
};

export const createCustomUpdateSchema = (
  table: Table,
  extraKeys: readonly string[] = [],
) => {
  const schema = createUpdateSchema(table);
  return t.Omit(schema, [...commonOmittedKeys, ...extraKeys]);
};
