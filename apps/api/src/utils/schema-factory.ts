import { Type } from "@sinclair/typebox";
import {
  createSchemaFactory as baseCreateSchemaFactory,
  CreateSchemaFactoryOptions,
} from "drizzle-typebox";

import type { Table } from "drizzle-orm";

export const AUDIT_FIELDS = [
  "createdBy",
  "createdAt",
  "updatedBy",
  "updatedAt",
  "deletedBy",
  "deletedAt",
] as const;

export const ID_FIELDS = ["id", "slug"] as const;

// TODO: We are breaking the type inference here. Fix this for the sake of consumers.
export function createSchemaFactory(ops?: CreateSchemaFactoryOptions) {
  const base = baseCreateSchemaFactory(ops);

  const createSelectSchema = (entity: Table, keys?: readonly string[]) => {
    const schema = base.createSelectSchema(entity);
    return keys ? (ops?.typeboxInstance ?? Type).Omit(schema, keys) : schema;
  };

  const createInsertSchema = (entity: Table, keys?: readonly string[]) => {
    const schema = base.createInsertSchema(entity);
    return keys ? (ops?.typeboxInstance ?? Type).Omit(schema, keys) : schema;
  };

  const createUpdateSchema = (entity: Table, keys?: readonly string[]) => {
    const schema = base.createUpdateSchema(entity);
    return keys ? (ops?.typeboxInstance ?? Type).Omit(schema, keys) : schema;
  };

  return {
    createSelectSchema,
    createInsertSchema,
    createUpdateSchema,
  };
}
