import { and, asc, eq, isNull } from "drizzle-orm";
import { status } from "elysia";

import { agents } from "@hebo/db/schema/agents";
import supportedModels from "@hebo/shared-data/supported-models.json";

import type { AuditFields } from "~/middlewares/audit-fields";
import { BranchService } from "~/modules/branches/service";
import { createSlug } from "~/utils/create-slug";
import { getDb } from "~/utils/request-db";

import * as AgentsModel from "./model";

const SupportedModelNames = new Set(supportedModels.map((m) => m.name));

// TODO: reduce audit fields boilerplate by using helpers from the db package. example here: https://gist.github.com/heiwen/edda78c2b3f5c544cb71ade03ecc1110
export const AgentService = {
  async createAgent(input: AgentsModel.CreateBody, auditFields: AuditFields) {
    const slug = createSlug(input.name, true);

    const { defaultModel, ...agentData } = input;

    if (!SupportedModelNames.has(defaultModel))
      throw status(400, AgentsModel.InvalidModel.const);

    const client = getDb();

    // Insert the agent record and its initial branch; rely on request-level transaction when present
    const [createdAgent] = await client
      .insert(agents)
      .values({
        ...agentData,
        slug,
        createdBy: auditFields.createdBy,
        updatedBy: auditFields.updatedBy,
      })
      .onConflictDoNothing()
      .returning();

    // TODO: Apply a fallback strategy with retries with different slugs
    if (!createdAgent) throw status(409, AgentsModel.AlreadyExists.const);

    await BranchService.createInitialBranch(
      createdAgent.id,
      defaultModel,
      auditFields,
    );

    return createdAgent;
  },

  async listAgents() {
    const agentList = await getDb()
      .select()
      .from(agents)
      .where(isNull(agents.deletedAt))
      .orderBy(asc(agents.createdAt));
    return agentList;
  },

  async getAgentBySlug(agentSlug: string) {
    const [agent] = await getDb()
      .select()
      .from(agents)
      .where(and(eq(agents.slug, agentSlug), isNull(agents.deletedAt)));

    if (!agent) {
      throw status(404, AgentsModel.NotFound.const);
    }
    return agent;
  },

  async updateAgent(
    agentSlug: string,
    input: AgentsModel.UpdateBody,
    auditFields: AuditFields,
  ) {
    const [agent] = await getDb()
      .update(agents)
      .set({ ...input, updatedBy: auditFields.updatedBy })
      .where(and(eq(agents.slug, agentSlug), isNull(agents.deletedAt)))
      .returning();

    if (!agent) {
      throw status(404, AgentsModel.NotFound.const);
    }
    return agent;
  },

  async softDeleteAgent(agentSlug: string, auditFields: AuditFields) {
    const deletedAt = new Date();

    await getDb()
      .update(agents)
      .set({ deletedBy: auditFields.deletedBy, deletedAt })
      .where(and(eq(agents.slug, agentSlug), isNull(agents.deletedAt)));
  },
};
