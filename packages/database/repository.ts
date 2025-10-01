import { PrismaPg } from "@prisma/adapter-pg";

import { connectionString } from "./config";
import { unwrap } from "./src/errors";
import { PrismaClient, type Prisma } from "./src/generated/prisma/client";
import { createSlug } from "./src/utils/create-slug";

const agentInclude = (withBranches = false): Prisma.AgentInclude =>
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
    create: async (name: string, defaultModel: string, withBranches = false) =>
      // FUTURE: Apply a fallback strategy with retries with different slugs in case of conflict
      client.agent.create({
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
        include: agentInclude(withBranches),
      }),

    getAll: async (withBranches = false) =>
      client.agent.findMany({
        where: {},
        include: agentInclude(withBranches),
      }),

    getBySlug: async (agentSlug: string, withBranches = false) =>
      unwrap(
        client.agent.findFirst({
          where: { slug: agentSlug },
          include: agentInclude(withBranches),
        }),
      ),

    update: async (
      agentSlug: string,
      name: string | undefined,
      withBranches = false,
    ) =>
      client.agent.update({
        where: { slug: agentSlug },
        data: { name },
        include: agentInclude(withBranches),
      }),

    softDelete: async (agentSlug: string) =>
      client.agent.update({
        where: { slug: agentSlug },
        data: { deleted_by: userId, deleted_at: new Date() },
      }),
  };
};

export const createBranchRepo = (userId: string, agentSlug: string) => {
  const client = prisma(userId);

  const findBranchBySlug = async (branchSlug: string) =>
    unwrap(
      client.branch.findFirst({
        where: { agent_slug: agentSlug, slug: branchSlug },
      }),
    );

  return {
    getAll: async () =>
      client.branch.findMany({ where: { agent_slug: agentSlug } }),

    getBySlug: async (branchSlug: string) => findBranchBySlug(branchSlug),

    update: async (
      branchSlug: string,
      name: string | undefined,
      models: any[] | undefined,
    ) => {
      const branch = await findBranchBySlug(branchSlug);
      return client.branch.update({
        where: { id: branch.id },
        data: { name, models },
      });
    },

    softDelete: async (branchSlug: string) => {
      const branch = await findBranchBySlug(branchSlug);
      return client.branch.update({
        where: { id: branch.id },
        data: { deleted_by: userId, deleted_at: new Date() },
      });
    },

    copy: async (sourceBranchSlug: string, name: string) => {
      const sourceBranch = await findBranchBySlug(sourceBranchSlug);
      const slug = createSlug(name);
      return client.branch.create({
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
