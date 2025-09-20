import { asc, eq } from "drizzle-orm";
import { status } from "elysia";

import { agents } from "@hebo/db/schema/agents";
import { withAudit } from "@hebo/db/utils/with-audit";

import { BranchService } from "~api/modules/branches/service";
import { createSlug } from "~api/utils/create-slug";
import { getDb, runInRequestTransaction } from "~api/utils/request-db";

import * as AgentsModel from "./model";

export const AgentService = {
  async createAgent(input: AgentsModel.CreateBody, userId: string) {
    return runInRequestTransaction(async () => {
      const slug = createSlug(input.name, true);
      const { defaultModel, ...agentData } = input;

      if (!AgentsModel.SupportedModelNames.has(defaultModel))
        throw status(400, AgentsModel.InvalidModel.const);

      const agentsRepo = withAudit(agents, { userId });

      // Insert the agent record and its initial branch; rely on request-level transaction when present
      const [agent] = await agentsRepo
        .insert(getDb(), { ...agentData, slug })
        .onConflictDoNothing()
        .returning();

      // FUTURE: Apply a fallback strategy with retries with different slugs
      if (!agent) throw status(409, AgentsModel.AlreadyExists.const);

      await BranchService.createInitialBranch(agent.id, defaultModel, userId);
      return agent;
    });
  },

  async listAgents(userId: string) {
    const agentsRepo = withAudit(agents, { userId });
    const agentList = await agentsRepo
      .select(getDb())
      .orderBy(asc(agents.createdAt));
    return agentList;
  },

  async getAgentBySlug(
    agentSlug: string,
    userId: string,
    expand?: AgentsModel.AgentExpand,
  ) {
    const agentsRepo = withAudit(agents, { userId });
    const [agent] = await agentsRepo.select(
      getDb(),
      eq(agents.slug, agentSlug),
    );

    if (!agent) {
      throw status(404, AgentsModel.NotFound.const);
    }

    const branches = await BranchService.listBranches(agent.id, userId);
    if (expand === "branches") {
      return { ...agent, branches };
    }
    return { ...agent, branches: branches.map((b) => b.slug) };
  },

  async updateAgent(
    agentSlug: string,
    input: AgentsModel.UpdateBody,
    userId: string,
  ) {
    const agentsRepo = withAudit(agents, { userId });
    const [agent] = await agentsRepo
      .update(getDb(), { ...input }, eq(agents.slug, agentSlug))
      .returning();

    if (!agent) {
      throw status(404, AgentsModel.NotFound.const);
    }
    return agent;
  },

  async softDeleteAgent(agentSlug: string, userId: string) {
    const agentsRepo = withAudit(agents, { userId });
    await agentsRepo.delete(getDb(), eq(agents.slug, agentSlug));
  },
};
