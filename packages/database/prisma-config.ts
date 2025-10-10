import { PrismaPg } from "@prisma/adapter-pg";
import { Resource } from "sst";

import { PrismaClient } from "./src/generated/prisma/client";

export const connectionString = (() => {
  try {
    // @ts-expect-error: HeboDatabase may not be defined
    const db = Resource.HeboDatabase;
    return `postgresql://${db.username}:${db.password}@${db.host}:${db.port}/${db.database}?sslmode=verify-full`;
  } catch {
    return "postgresql://postgres:password@localhost:5432/local";
  }
})();

process.env.DATABASE_URL = connectionString;

// eslint-disable-next-line unicorn/no-null
const dbNull = null;
const adapter = new PrismaPg({ connectionString });
const _prisma = new PrismaClient({ adapter });

export const prismaExtended = (userId: string) =>
  _prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query, operation }) {
          if ("where" in args) {
            args.where = {
              ...args.where,
              created_by: userId,
              deleted_at: dbNull,
            };
          }

          if (operation === "update") {
            args.data = {
              ...args.data,
              updated_by: userId,
            };
          }

          return query(args);
        },
      },
    },
  });
