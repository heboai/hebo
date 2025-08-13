import { t } from "elysia";

export const ErrorResponse = t.Object({ error: t.String() });

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

export const omitCommon = <S>(schema: S, extraKeys: readonly string[] = []) =>
  t.Omit(
    schema as never,
    [...commonOmittedKeys, ...extraKeys] as readonly string[],
  );
