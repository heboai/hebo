import { t } from "elysia";

import type { TSchema } from "@sinclair/typebox";

// Common fields managed by the database and server logic that should be omitted
// from client-provided payloads for create/update operations.
export const commonOmittedKeys = [
  "id",
  "slug",
  "createdBy",
  "createdAt",
  "updatedBy",
  "updatedAt",
  "deletedBy",
  "deletedAt",
] as const;

export const omitCommon = (
  schema: TSchema,
  extraKeys: readonly string[] = [],
) => t.Omit(schema, [...commonOmittedKeys, ...extraKeys] as readonly string[]);

type ModelSchemasInput = {
  insert: TSchema;
  update: TSchema;
};

export const createModelSchemas = (
  schemas: ModelSchemasInput,
  extraOmittedKeys: readonly string[] = [],
) => {
  const createSchema = omitCommon(schemas.insert, extraOmittedKeys);
  const updateSchema = omitCommon(schemas.update, extraOmittedKeys);
  return { createSchema, updateSchema } as const;
};
