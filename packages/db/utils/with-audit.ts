import { and, isNull, sql, type SQL } from "drizzle-orm";

import type { UniversalDbClient } from "../drizzle";
import type { AnyPgColumn } from "drizzle-orm/pg-core";

type TableWithAudit = {
  deletedAt: AnyPgColumn;
  deletedBy: AnyPgColumn;
  createdBy: AnyPgColumn;
  updatedBy: AnyPgColumn;
  createdAt: AnyPgColumn;
  updatedAt: AnyPgColumn;
};

export type AuditContext = { userId: string };

/**
 * Wraps a Drizzle table with helpers that automatically:
 * - filter out soft-deleted records (deletedAt IS NULL)
 * - set audit fields (createdBy/updatedBy/deletedBy, updatedAt) on writes
 */
export function withAudit<TTable extends TableWithAudit>(
  table: TTable,
  ctx: AuditContext,
) {
  const where = (extra?: SQL) => {
    // FUTURE: As soon as auth is implemented, also include user/tenant scoping here,
    // e.g. and(eq(table.createdBy, ctx.userId), ...). For now we only filter soft-deleted rows.
    // FUTURE: add user/tenant scoping here
    return extra
      ? and(isNull(table.deletedAt), extra)
      : isNull(table.deletedAt);
  };
  return {
    where,

    select(db: UniversalDbClient, extra?: SQL) {
      return (db as any)
        .select()
        .from(table as any)
        .where(where(extra));
    },

    insert(db: UniversalDbClient, values: object) {
      return (db as any).insert(table as any).values({
        ...values,
        createdBy: ctx.userId,
        updatedBy: ctx.userId,
        // keep server-side timestamps consistent regardless of client clock
        createdAt: sql`now()`,
        updatedAt: sql`now()`,
      });
    },

    update(db: UniversalDbClient, values: object, extra?: SQL) {
      return (db as any)
        .update(table as any)
        .set({
          ...values,
          updatedBy: ctx.userId,
          updatedAt: sql`now()`,
        })
        .where(where(extra));
    },

    delete(db: UniversalDbClient, extra?: SQL) {
      return (db as any)
        .update(table as any)
        .set({
          deletedAt: sql`now()`,
          deletedBy: ctx.userId,
        })
        .where(where(extra));
    },
  } as const;
}
