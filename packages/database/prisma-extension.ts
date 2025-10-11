import { PrismaPg } from "@prisma/adapter-pg";
import { Resource } from "sst";

import { PrismaClient, Prisma } from "./src/generated/prisma/client";

export const connectionString = (() => {
  try {
    // @ts-expect-error: HeboDatabase may not be defined
    const db = Resource.HeboDatabase;
    return `postgresql://${db.username}:${db.password}@${db.host}:${db.port}/${db.database}?sslmode=verify-full`;
  } catch {
    return "postgresql://postgres:password@localhost:5432/local";
  }
})();

// eslint-disable-next-line unicorn/no-null
const dbNull = null;
const adapter = new PrismaPg({ connectionString, max: 25 });
const _prisma = new PrismaClient({ adapter });

export const prismaExtension = (userId: string) =>
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
    model: {
      $allModels: {
        async softDelete(
          where:
            | Prisma.agentsWhereUniqueInput
            | Prisma.branchesWhereUniqueInput,
        ) {
          const context = Prisma.getExtensionContext(this);
          return await context.update({
            where,
            data: { deleted_by: userId, deleted_at: new Date() },
          });
        },
      },
    },
  });
