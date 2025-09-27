import { PrismaPg } from "@prisma/adapter-pg";

import { connectionString } from "./prisma.config";
import { resolveOrThrow } from "./src/errors";
import { Prisma, PrismaClient } from "./src/generated/prisma/client";
import { createSlug } from "./src/utils/create-slug";

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

// eslint-disable-next-line unicorn/no-null
const dbNull = null;

export const createAgent = async (
  name: string,
  defaultModel: string,
  userId: string,
  includeBranches: boolean = false,
) => {
  const includeOption = includeBranches
    ? { branches: true }
    : { branches: { select: { slug: true } } };
  const slug = createSlug(name, true);
  // FUTURE: Apply a fallback strategy with retries with different slugs in case of conflict
  return await resolveOrThrow(
    prisma.agent.create({
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
      include: includeOption,
    }),
  );
};

export const getAllAgents = async (
  userId: string,
  includeBranches: boolean = false,
) => {
  const includeOption = includeBranches
    ? { branches: true }
    : { branches: { select: { slug: true } } };
  return await resolveOrThrow(
    prisma.agent.findMany({
      where: { created_by: userId, deleted_at: dbNull },
      include: includeOption,
    }),
  );
};

export const getAgentBySlug = async (
  agentSlug: string,
  userId: string,
  includeBranches: boolean = false,
) => {
  const includeOption = includeBranches
    ? { branches: true }
    : { branches: { select: { slug: true } } };
  return await resolveOrThrow(
    prisma.agent.findFirst({
      where: { slug: agentSlug, created_by: userId, deleted_at: dbNull },
      include: includeOption,
    }),
  );
};

export const updateAgent = async (
  agentSlug: string,
  name: string | undefined,
  userId: string,
  includeBranches: boolean = false,
) => {
  const includeOption = includeBranches
    ? { branches: true }
    : { branches: { select: { slug: true } } };
  return await resolveOrThrow(
    prisma.agent.update({
      where: { slug: agentSlug, created_by: userId, deleted_at: dbNull },
      data: { name: name, updated_by: userId },
      include: includeOption,
    }),
  );
};

export const softDeleteAgent = async (agentSlug: string, userId: string) => {
  return await resolveOrThrow(
    prisma.agent.update({
      where: { slug: agentSlug, created_by: userId, deleted_at: dbNull },
      data: { deleted_by: userId, deleted_at: new Date() },
    }),
  );
};

export const getAllBranches = async (agentSlug: string, userId: string) => {
  return await resolveOrThrow(
    prisma.branch.findMany({
      where: { agent_slug: agentSlug, created_by: userId, deleted_at: dbNull },
    }),
  );
};

export const getBranchBySlug = async (
  agentSlug: string,
  branchSlug: string,
  userId: string,
) => {
  return await resolveOrThrow(
    prisma.branch.findFirst({
      where: {
        agent_slug: agentSlug,
        slug: branchSlug,
        created_by: userId,
        deleted_at: dbNull,
      },
    }),
  );
};

export const updateBranch = async (
  agentSlug: string,
  branchSlug: string,
  name: string | undefined,
  models: any[] | undefined,
  userId: string,
) => {
  return await resolveOrThrow(
    prisma.branch.update({
      where: {
        branch_agent_slug: { slug: branchSlug, agent_slug: agentSlug },
        created_by: userId,
        deleted_at: dbNull,
      },
      data: { name, models, updated_by: userId },
    }),
  );
};

export const softDeleteBranch = async (
  agentSlug: string,
  branchSlug: string,
  userId: string,
) => {
  return await resolveOrThrow(
    prisma.branch.update({
      where: {
        branch_agent_slug: { slug: branchSlug, agent_slug: agentSlug },
        created_by: userId,
        deleted_at: dbNull,
      },
      data: { deleted_by: userId, deleted_at: new Date() },
    }),
  );
};

export const copyBranch = async (
  agentSlug: string,
  sourceBranchSlug: string,
  name: string,
  userId: string,
) => {
  const sourceBranch = await resolveOrThrow(
    prisma.branch.findFirst({
      where: {
        agent_slug: agentSlug,
        slug: sourceBranchSlug,
        created_by: userId,
        deleted_at: dbNull,
      },
    }),
  );

  const slug = createSlug(name);

  return await resolveOrThrow(
    prisma.branch.create({
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
};
