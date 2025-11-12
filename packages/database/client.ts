import { PrismaPg } from "@prisma/adapter-pg";
import { Resource } from "sst";

import type { ProviderConfig } from "@hebo/shared-data/types/providers";
import { redactProviderConfig } from "@hebo/shared-data/utils/redact-provider";

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

// eslint-disable-next-line unicorn/no-null
const dbNull = null;

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
            const a = args as { where?: Record<string, unknown> };
            a.where = { ...a.where, created_by: userId, deleted_at: dbNull };
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
      providers: {
        async getUnredacted(name: string) {
          return _prisma.providers.findFirstOrThrow({
            where: { name, created_by: userId, deleted_at: dbNull },
          });
        },
      },
    },
    result: {
      providers: {
        config: {
          needs: { config: true },
          compute({ config }: { config: ProviderConfig }) {
            return redactProviderConfig(config);
          },
        },
      },
    },
  });
};
