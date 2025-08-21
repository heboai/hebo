import { and, isNull, sql, type SQL, type InferInsertModel } from "drizzle-orm";

import type { UniversalDbClient } from "../drizzle";
import type { AnyPgTable, AnyPgColumn } from "drizzle-orm/pg-core";

export type AuditContext = { userId: string };

type AuditCols =
  | "createdBy"
  | "updatedBy"
  | "createdAt"
  | "updatedAt"
  | "deletedAt"
  | "deletedBy";

type ColumnsWithAudit<T extends AnyPgTable> = T["_"]["columns"] &
  Record<AuditCols, AnyPgColumn>;

export const withAudit = <TTable extends AnyPgTable>(
  table: TTable,
  ctx: AuditContext,
) => {
  const cols = table._.columns as ColumnsWithAudit<TTable>;

  // FUTURE: As soon as auth is implemented, also include user/tenant scoping here,
  // e.g. and(eq(table.createdBy, ctx.userId), ...). For now we only filter soft-deleted rows.
  // FUTURE: add user/tenant scoping here
  const where = (extra?: SQL) =>
    extra ? and(isNull(cols.deletedAt), extra) : isNull(cols.deletedAt);

  return {
    where,

    select(db: UniversalDbClient, extra?: SQL) {
      // Drizzle generic guard sometimes misfires here for generic wrappers:
      // See: https://github.com/drizzle-team/drizzle-orm/issues/4069 and related threads.
      // @ts-expect-error — false positive for generic wrappers
      return db.select().from(table).where(where(extra));
    },

    insert(
      db: UniversalDbClient,
      values: Omit<InferInsertModel<TTable>, AuditCols>,
    ) {
      const fullValues = {
        ...values,
        createdBy: ctx.userId,
        updatedBy: ctx.userId,
        // keep server-side timestamps consistent regardless of client clock
        createdAt: sql`now()`,
        updatedAt: sql`now()`,
      } as InferInsertModel<TTable>;

      return db.insert(table).values(fullValues);
    },

    update(
      db: UniversalDbClient,
      values: Partial<InferInsertModel<TTable>>,
      extra?: SQL,
    ) {
      return db
        .update(table)
        .set({
          ...values,
          updatedBy: ctx.userId,
          updatedAt: sql`now()`,
        })
        .where(where(extra));
    },

    delete(db: UniversalDbClient, extra?: SQL) {
      return db
        .update(table)
        .set({
          deletedAt: sql`now()`,
          deletedBy: ctx.userId,
        } as Partial<InferInsertModel<TTable>>)
        .where(where(extra));
    },
  } as const;
};
