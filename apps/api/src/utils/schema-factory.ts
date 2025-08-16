export { createSchemaFactory } from "drizzle-typebox";

export const AUDIT_FIELDS = [
  "createdBy",
  "createdAt",
  "updatedBy",
  "updatedAt",
  "deletedBy",
  "deletedAt",
] as const;

export const ID_FIELDS = ["id"] as const;
