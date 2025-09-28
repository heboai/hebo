import { PrismaPg } from "@prisma/adapter-pg";

import { connectionString } from "./prisma.config";
import { resolveOrThrow } from "./src/errors";
import { PrismaClient, type Prisma } from "./src/generated/prisma/client";
import { createSlug } from "./src/utils/create-slug";

const agentInclude = (includeBranches: boolean): Prisma.AgentInclude =>
  includeBranches
    ? { branches: true }
    : { branches: { select: { slug: true } } };
// eslint-disable-next-line unicorn/no-null
const dbNull = null;
const adapter = new PrismaPg({ connectionString });
const _prisma = new PrismaClient({ adapter });

const prisma = (userId: string) =>
  _prisma.$extends({
    query: {
      $allOperations({ args, query }) {
        if ("where" in args) {
          args.where = {
            ...args.where,
            created_by: userId,
            deleted_at: dbNull,
          };
        }
        return query(args);
      },
    },
  });

export const AgentRepo = (userId: string) => ({
  async create(
    name: string,
    defaultModel: string,
    includeBranches: boolean = false,
  ) {
    const slug = createSlug(name, true);
    // FUTURE: Apply a fallback strategy with retries with different slugs in case of conflict
    return await resolveOrThrow(
      prisma(userId).agent.create({
        data: {
          name: name,
          slug: slug,
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
        include: agentInclude(includeBranches),
      }),
    );
  },

  async getAll(includeBranches: boolean = false) {
    return await resolveOrThrow(
      prisma(userId).agent.findMany({
        where: {},
        include: agentInclude(includeBranches),
      }),
    );
  },

  async getBySlug(agentSlug: string, includeBranches: boolean = false) {
    return await resolveOrThrow(
      prisma(userId).agent.findFirst({
        where: { slug: agentSlug },
        include: agentInclude(includeBranches),
      }),
    );
  },

  async update(
    agentSlug: string,
    name: string | undefined,
    includeBranches: boolean = false,
  ) {
    return await resolveOrThrow(
      prisma(userId).agent.update({
        where: { slug: agentSlug },
        data: { name: name, updated_by: userId },
        include: agentInclude(includeBranches),
      }),
    );
  },

  async softDelete(agentSlug: string) {
    return await resolveOrThrow(
      prisma(userId).agent.update({
        where: { slug: agentSlug },
        data: { deleted_by: userId, deleted_at: new Date() },
      }),
    );
  },
});

export const BranchRepo = (userId: string, agentSlug: string) => ({
  async getAll() {
    return await resolveOrThrow(
      prisma(userId).branch.findMany({
        where: { agent_slug: agentSlug },
      }),
    );
  },

  async getBySlug(branchSlug: string) {
    return await resolveOrThrow(
      prisma(userId).branch.findFirst({
        where: {
          agent_slug: agentSlug,
          slug: branchSlug,
        },
      }),
    );
  },

  async update(
    branchSlug: string,
    name: string | undefined,
    models: any[] | undefined,
  ) {
    return await resolveOrThrow(
      prisma(userId).branch.update({
        where: {
          branch_agent_slug: { slug: branchSlug, agent_slug: agentSlug },
        },
        data: { name, models, updated_by: userId },
      }),
    );
  },

  async softDelete(branchSlug: string) {
    return await resolveOrThrow(
      prisma(userId).branch.update({
        where: {
          branch_agent_slug: { slug: branchSlug, agent_slug: agentSlug },
        },
        data: { deleted_by: userId, deleted_at: new Date() },
      }),
    );
  },

  async copy(sourceBranchSlug: string, name: string) {
    const userScoped = prisma(userId);
    const sourceBranch = await resolveOrThrow(
      userScoped.branch.findFirst({
        where: {
          agent_slug: agentSlug,
          slug: sourceBranchSlug,
        },
      }),
    );

    const slug = createSlug(name);

    return await resolveOrThrow(
      userScoped.branch.create({
        data: {
          agent_slug: agentSlug,
          name,
          slug,
          // Cast to InputJsonValue because Prisma reads JSON arrays as JsonValue[]
          models: sourceBranch.models as Prisma.InputJsonValue[],
          created_by: userId,
          updated_by: userId,
        },
      }),
    );
  },
});
