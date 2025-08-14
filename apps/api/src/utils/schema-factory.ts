import { Type, type TObject, type TProperties } from "@sinclair/typebox";
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

export function createSchemaFactory(ops?: CreateSchemaFactoryOptions) {
  const base = baseCreateSchemaFactory(ops);
  const TB = ops?.typeboxInstance ?? Type;

  type PropsOf<T> = T extends TObject<infer P> ? P : never;

  // Accept ANY builder that returns a TObject<any>; infer its props (P) from ReturnType<F>
  const withOmit =
    <F extends (t: any) => TObject<any>>(fn: F) =>
    <
      T extends Parameters<F>[0] & Table,
      P extends TProperties = PropsOf<ReturnType<F>>,
      K extends keyof P & string = never,
    >(
      table: T,
      keys?: readonly K[],
    ): TObject<Omit<P, K>> => {
      const schema = fn(table) as TObject<P>;

      if (keys?.length) {
        // TypeBox returns a proper TObject; assert the narrowed props type
        return TB.Omit(schema, keys as readonly string[]) as unknown as TObject<
          Omit<P, K>
        >;
      }
      // When no keys: K = never, so Omit<P, K> = P (cast via unknown to satisfy TS)
      return schema as unknown as TObject<Omit<P, K>>;
    };

  return {
    createSelectSchema: withOmit(base.createSelectSchema),
    createInsertSchema: withOmit(base.createInsertSchema),
    createUpdateSchema: withOmit(base.createUpdateSchema),
  };
}
