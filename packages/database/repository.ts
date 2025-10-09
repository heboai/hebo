import { PrismaPg } from "@prisma/adapter-pg";

import { connectionString } from "./config";
import { PrismaClient, type Prisma } from "./src/generated/prisma/client";
import { createSlug } from "./src/utils/create-slug";

const agentInclude = (withBranches = false): Prisma.agentsInclude =>
  withBranches ? { branches: true } : { branches: { select: { slug: true } } };

// eslint-disable-next-line unicorn/no-null
const dbNull = null;
const adapter = new PrismaPg({ connectionString });
const _prisma = new PrismaClient({ adapter });

const prisma = (userId: string) =>
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

export const createAgentRepo = (userId: string) => {
  const client = prisma(userId);

  return {
    create: async (name: string, defaultModel: string) =>
      // FUTURE: Apply a fallback strategy with retries with different slugs in case of conflict
      client.agents.create({
        data: {
          name,
          slug: createSlug(name, true),
          created_by: userId,
          updated_by: userId,
          branches: {
            create: {
              name: "Main",
              slug: "main",
              created_by: userId,
              updated_by: userId,
              models: [{ alias: "default", type: defaultModel }],
            },
          },
        },
        include: agentInclude(true),
      }),

    getAll: async (withBranches = false) =>
      client.agents.findMany({
        where: {},
        include: agentInclude(withBranches),
      }),

    getBySlug: async (agentSlug: string, withBranches = false) =>
      client.agents.findFirstOrThrow({
        where: { slug: agentSlug },
        include: agentInclude(withBranches),
      }),

    update: async (
      agentSlug: string,
      name: string | undefined,
      withBranches = false,
    ) =>
      client.agents.update({
        where: { slug: agentSlug },
        data: { name },
        include: agentInclude(withBranches),
      }),

    softDelete: async (agentSlug: string) =>
      client.agents.update({
        where: { slug: agentSlug },
        data: { deleted_by: userId, deleted_at: new Date() },
      }),
  };
};

export const createBranchRepo = (userId: string, agentSlug: string) => {
  const client = prisma(userId);

  const findBranchBySlug = async (branchSlug: string) =>
    client.branches.findFirstOrThrow({
      where: { agent_slug: agentSlug, slug: branchSlug },
    });

  return {
    getAll: async () =>
      client.branches.findMany({ where: { agent_slug: agentSlug } }),

    getBySlug: async (branchSlug: string) => findBranchBySlug(branchSlug),

    update: async (
      branchSlug: string,
      name: string | undefined,
      models: any[] | undefined,
    ) => {
      const branch = await findBranchBySlug(branchSlug);
      return client.branches.update({
        where: { id: branch.id },
        data: { name, models },
      });
    },

    softDelete: async (branchSlug: string) => {
      const branch = await findBranchBySlug(branchSlug);
      return client.branches.update({
        where: { id: branch.id },
        data: { deleted_by: userId, deleted_at: new Date() },
      });
    },

    copy: async (sourceBranchSlug: string, name: string) => {
      const sourceBranch = await findBranchBySlug(sourceBranchSlug);
      const slug = createSlug(name);
      return client.branches.create({
        data: {
          agent_slug: agentSlug,
          name,
          slug,
          // Cast to InputJsonValue because Prisma reads JSON arrays as JsonValue[]
          models: sourceBranch.models as Prisma.InputJsonValue[],
          created_by: userId,
          updated_by: userId,
        },
      });
    },
  };
};
