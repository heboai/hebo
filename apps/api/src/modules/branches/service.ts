import { and, asc, eq, isNull } from "drizzle-orm";
import { status } from "elysia";

import { db } from "@hebo/db";
import type { UniversalDbClient } from "@hebo/db";
import { agents } from "@hebo/db/schema/agents";
import { branches } from "@hebo/db/schema/branches";

import { createSlug } from "~/utils/create-slug";

import * as BranchesModel from "./model";

export const BranchService = {
  async verifyAgent(agentSlug: string) {
    const [agent] = await db
      .select()
      .from(agents)
      .where(and(eq(agents.slug, agentSlug), isNull(agents.deletedAt)));

    if (!agent) {
      throw status(
        404,
        "Agent not found" satisfies BranchesModel.AgentNotFound,
      );
    }

    return agent;
  },

  async createBranchRecord(
    agentId: string,
    input: BranchesModel.CreateBody,
    client: UniversalDbClient = db,
  ) {
    // TODO: replace with actual user id coming from auth
    const [createdBy, updatedBy] = ["dummy", "dummy"];
    const slug = createSlug(input.name);

    const [branch] = await client
      .insert(branches)
      .values({ agentId, ...input, slug, createdBy, updatedBy })
      .onConflictDoNothing()
      .returning();

    if (!branch)
      throw status(
        409,
        "Branch with this name already exists" satisfies BranchesModel.AlreadyExists,
      );

    return branch;
  },

  async createInitialBranch(
    client: UniversalDbClient = db,
    agentId: string,
    defaultModel: string,
  ) {
    const model = { alias: "default" as const, type: defaultModel };
    return this.createBranchRecord(
      agentId,
      {
        name: "main",
        models: [model],
      } as BranchesModel.CreateBody,
      client,
    );
  },

  async createBranch(agentSlug: string, input: BranchesModel.CreateBody) {
    const agent = await this.verifyAgent(agentSlug);
    return this.createBranchRecord(agent.id, input);
  },

  async listBranches(agentSlug: string) {
    const agent = await this.verifyAgent(agentSlug);
    const agentId = agent.id;

    const branchList = await db
      .select()
      .from(branches)
      .where(and(eq(branches.agentId, agentId), isNull(branches.deletedAt)))
      .orderBy(asc(branches.createdAt));
    return branchList;
  },

  async getBranchBySlug(agentSlug: string, branchSlug: string) {
    const agent = await this.verifyAgent(agentSlug);
    const agentId = agent.id;

    const [branch] = await db
      .select()
      .from(branches)
      .where(
        and(
          eq(branches.slug, branchSlug),
          eq(branches.agentId, agentId),
          isNull(branches.deletedAt),
        ),
      );

    if (!branch)
      throw status(404, "Branch not found" satisfies BranchesModel.NotFound);
    return branch;
  },

  async updateBranch(
    agentSlug: string,
    branchSlug: string,
    input: BranchesModel.UpdateBody,
  ) {
    const agent = await this.verifyAgent(agentSlug);
    const agentId = agent.id;

    // TODO: replace with actual user id coming from auth
    const updatedBy = "dummy";

    const [branch] = await db
      .update(branches)
      .set({ ...input, updatedBy })
      .where(
        and(
          eq(branches.slug, branchSlug),
          eq(branches.agentId, agentId),
          isNull(branches.deletedAt),
        ),
      )
      .returning();

    if (!branch)
      throw status(404, "Branch not found" satisfies BranchesModel.NotFound);
    return branch;
  },
};
