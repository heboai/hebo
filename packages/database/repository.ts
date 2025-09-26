import { PrismaPg } from "@prisma/adapter-pg";

import { connectionString } from "./prisma.config";
import { createSlug } from "./src/create-slug";
import { Prisma, PrismaClient } from "./src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

export const createAgent = async (
  name: string,
  defaultModel: string,
  userId: string,
  includeBranches: boolean = true,
) => {
  const slug = createSlug(name, true);
  // FUTURE: Apply a fallback strategy with retries with different slugs in case of conflict
  return await prisma.agent.create({
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
    include: { branches: includeBranches },
  });
};

export const getAllAgents = async (
  userId: string,
  includeBranches: boolean = true,
) => {
  return await prisma.agent.findMany({
    where: { created_by: userId, deleted_at: undefined },
    include: { branches: includeBranches },
  });
};

export const getAgentBySlug = async (
  agentSlug: string,
  userId: string,
  includeBranches: boolean = true,
) => {
  return await prisma.agent.findFirst({
    where: { slug: agentSlug, created_by: userId, deleted_at: undefined },
    include: { branches: includeBranches },
  });
};

export const updateAgent = async (
  agentSlug: string,
  name: string,
  userId: string,
  includeBranches: boolean = true,
) => {
  return await prisma.agent.update({
    where: { slug: agentSlug, created_by: userId, deleted_at: undefined },
    data: { name: name, updated_by: userId },
    include: { branches: includeBranches },
  });
};

export const softDeleteAgent = async (agentSlug: string, userId: string) => {
  await prisma.agent.update({
    where: { slug: agentSlug, created_by: userId, deleted_at: undefined },
    data: { deleted_by: userId, deleted_at: new Date() },
  });
};

export const getAllBranches = async (agentSlug: string, userId: string) => {
  return await prisma.branch.findMany({
    where: { agent_slug: agentSlug, created_by: userId, deleted_at: undefined },
  });
};

export const getBranchBySlug = async (
  agentSlug: string,
  branchSlug: string,
  userId: string,
) => {
  return await prisma.branch.findFirst({
    where: {
      agent_slug: agentSlug,
      slug: branchSlug,
      created_by: userId,
      deleted_at: undefined,
    },
  });
};

export const updateBranch = async (
  agentSlug: string,
  branchSlug: string,
  name: string,
  models: any[],
  userId: string,
) => {
  return await prisma.branch.update({
    where: {
      branch_agent_slug: { slug: branchSlug, agent_slug: agentSlug },
      created_by: userId,
      deleted_at: undefined,
    },
    data: { name, models, updated_by: userId },
  });
};

export const softDeleteBranch = async (
  agentSlug: string,
  branchSlug: string,
  userId: string,
) => {
  await prisma.branch.update({
    where: {
      branch_agent_slug: { slug: branchSlug, agent_slug: agentSlug },
      created_by: userId,
      deleted_at: undefined,
    },
    data: { deleted_by: userId, deleted_at: new Date() },
  });
};

export const copyBranch = async (
  agentSlug: string,
  sourceBranchSlug: string,
  name: string,
  userId: string,
) => {
  const sourceBranch = await prisma.branch.findFirst({
    where: {
      agent_slug: agentSlug,
      slug: sourceBranchSlug,
      created_by: userId,
      deleted_at: undefined,
    },
  });

  if (!sourceBranch) {
    return;
  }

  const slug = createSlug(name);

  return await prisma.branch.create({
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
};
