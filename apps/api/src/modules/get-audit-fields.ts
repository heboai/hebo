import { Elysia } from "elysia";

export type AuditFields = {
  createdBy: string;
  updatedBy: string;
  deletedBy: string;
};

/**
 * Dummy audit fields injector.
 * Replaces later with real auth; for now always uses "dummy".
 * TODO: Replace with real auth.
 */
export const getAuditFields = new Elysia({ name: "get-audit-fields" })
  .derive(() => {
    const userId = "dummy" as const;
    const auditFields: AuditFields = {
      createdBy: userId,
      updatedBy: userId,
      deletedBy: userId,
    };
    return { auditFields } as const;
  })
  .as("scoped");
