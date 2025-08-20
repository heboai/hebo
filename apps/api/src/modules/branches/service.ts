import { and, asc, eq } from "drizzle-orm";
import { status } from "elysia";

import { branches } from "@hebo/db/schema/branches";
import { withAudit } from "@hebo/db/utils/with-audit";

import { createSlug } from "~/utils/create-slug";
import { getDb } from "~/utils/request-db";

import * as BranchesModel from "./model";

export const BranchService = {
  async createBranch(
    agentId: string,
    input: BranchesModel.CreateBody,
    userId: string,
  ) {
    const slug = createSlug(input.name);

    const branchesRepo = withAudit(branches, { userId });
    const [branch] = await branchesRepo
      .insert(getDb(), { agentId, ...input, slug })
      .onConflictDoNothing()
      .returning();

    if (!branch) throw status(409, BranchesModel.AlreadyExists.const);

    return branch;
  },

  async createInitialBranch(
    agentId: string,
    defaultModel: string,
    userId: string,
  ) {
    const model = { alias: "default" as const, type: defaultModel };
    return this.createBranch(
      agentId,
      {
        name: "main",
        models: [model],
      } as BranchesModel.CreateBody,
      userId,
    );
  },

  async listBranches(agentId: string, userId: string) {
    const branchesRepo = withAudit(branches, { userId });
    const branchList = await branchesRepo
      .select(getDb(), eq(branches.agentId, agentId))
      .orderBy(asc(branches.createdAt));
    return branchList;
  },

  async getBranchBySlug(agentId: string, branchSlug: string, userId: string) {
    const branchesRepo = withAudit(branches, { userId });
    const [branch] = await branchesRepo.select(
      getDb(),
      and(eq(branches.slug, branchSlug), eq(branches.agentId, agentId)),
    );

    if (!branch) throw status(404, BranchesModel.NotFound.const);
    return branch;
  },

  async updateBranch(
    agentId: string,
    branchSlug: string,
    input: BranchesModel.UpdateBody,
    userId: string,
  ) {
    const branchesRepo = withAudit(branches, { userId });
    const [branch] = await branchesRepo
      .update(
        getDb(),
        { ...input },
        and(eq(branches.slug, branchSlug), eq(branches.agentId, agentId)),
      )
      .returning();

    if (!branch) throw status(404, BranchesModel.NotFound.const);
    return branch;
  },
};
