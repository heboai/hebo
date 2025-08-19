import { Elysia } from "elysia";

export type AuditFields = {
  createdBy: string;
  updatedBy: string;
  deletedBy: string;
};

/**
 * Dummy audit fields injector.
 * Replaces later with real auth; for now always uses "dummy".
 */
export const auditFields = new Elysia({ name: "audit-fields" })
  .derive(() => {
    // TODO: Replace with real auth.
    const userId = "dummy" as const;
    const auditFields: AuditFields = {
      createdBy: userId,
      updatedBy: userId,
      deletedBy: userId,
    };
    return { auditFields } as const;
  })
  .as("scoped");
