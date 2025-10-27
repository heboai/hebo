import { PrismaPg } from "@prisma/adapter-pg";
import { Resource } from "sst";

import type { Models } from "@hebo/shared-data/types/models";
import { redactModels } from "@hebo/shared-data/utils/redact-models";

import { PrismaClient, Prisma } from "./src/generated/prisma/client";

export const connectionString = (() => {
  try {
    // @ts-expect-error: HeboDatabase may not be defined
    const db = Resource.HeboDatabase;
    return `postgresql://${db.username}:${db.password}@${db.host}:${db.port}/${db.database}?sslmode=verify-full`;
  } catch {
    // FUTURE: remember to update this and the db script after updating the predev script at root
    return "postgresql://postgres:password@localhost:5432/local";
  }
})();

const _prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString, max: 25 }),
});

export const createDbClient = (userId: string) => {
  if (!userId) {
    throw new Error("User ID is required");
  }
  return _prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query, operation }) {
          if (operation !== "create") {
            const a = args as unknown as { where?: Record<string, unknown> };
            // eslint-disable-next-line unicorn/no-null
            a.where = { ...a.where, created_by: userId, deleted_at: null };
          }

          return query(args);
        },
        async create({ args, model, query }) {
          args.data = {
            ...args.data,
            created_by: userId,
            updated_by: userId,
          };

          if (model === "agents" && args.data.branches) {
            args.data.branches.create = {
              ...args.data.branches.create,
              created_by: userId,
              updated_by: userId,
            };
          }
          return query(args);
        },
        async update({ args, query }) {
          args.data = {
            ...args.data,
            updated_by: userId,
          };
          return query(args);
        },
      },
    },
    model: {
      $allModels: {
        async softDelete<T>(where: T) {
          const context = Prisma.getExtensionContext(this);
          return context.update({
            where,
            data: { deleted_by: userId, deleted_at: new Date() },
          });
        },
      },
      branches: {
        async getFullModels(where: Prisma.branchesWhereInput): Promise<Models> {
          const result = await _prisma.branches.findFirstOrThrow({
            // eslint-disable-next-line unicorn/no-null
            where: { ...where, created_by: userId, deleted_at: null },
            select: { models: true },
          });
          return result.models as unknown as Models;
        },
        async copy(
          where: Prisma.branchesWhereInput,
          data: Partial<Prisma.branchesCreateInput>,
        ) {
          const context = Prisma.getExtensionContext(this);
          const models = await context.getFullModels(where);
          return context.create({
            data: {
              ...data,
              models,
            } as any,
          });
        },
      },
    },
    result: {
      branches: {
        models: {
          needs: { models: true },
          compute({ models }: { models: Models }) {
            return redactModels(models);
          },
        },
      },
    },
  });
};
