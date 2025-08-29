import {
  and,
  eq,
  getTableColumns,
  isNull,
  sql,
  type SQL,
  type InferInsertModel,
} from "drizzle-orm";

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

// Using the runtime-safe API. This type refines the returned columns map
// to ensure our audit fields are present, without touching the table type itself.
type ColumnsWithAudit<T extends AnyPgTable> = ReturnType<
  typeof getTableColumns<T>
> &
  Record<AuditCols, AnyPgColumn>;

export const withAudit = <TTable extends AnyPgTable>(
  table: TTable,
  ctx: AuditContext,
) => {
  const cols = getTableColumns(table) as ColumnsWithAudit<TTable>;

  const where = (extra?: SQL) =>
    extra
      ? and(eq(cols.createdBy, ctx.userId), isNull(cols.deletedAt), extra)
      : and(eq(cols.createdBy, ctx.userId), isNull(cols.deletedAt));

  return {
    where,

    select(db: UniversalDbClient, extra?: SQL) {
      // See related generic-guard issue:
      // https://github.com/drizzle-team/drizzle-orm/issues/4069
      // @ts-expect-error — Drizzle conditional type false-positives for generic wrappers
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
