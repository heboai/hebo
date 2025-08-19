import { and, asc, eq, isNull } from "drizzle-orm";
import { status } from "elysia";

import { db } from "@hebo/db";
import { agents } from "@hebo/db/schema/agents";
import supportedModels from "@hebo/shared-data/supported-models.json";

import type { AuditFields } from "~/middlewares/get-audit-fields";
import { BranchService } from "~/modules/branches/service";
import { createSlug } from "~/utils/create-slug";

import * as AgentsModel from "./model";

const SupportedModelNames = new Set(supportedModels.map((m) => m.name));

export const AgentService = {
  async createAgent(input: AgentsModel.CreateBody, auditFields: AuditFields) {
    const slug = createSlug(input.name, true);

    const { defaultModel, ...agentData } = input;

    if (!SupportedModelNames.has(defaultModel))
      throw status(
        400,
        "Invalid model name" satisfies AgentsModel.InvalidModel,
      );

    // Insert the agent record and its initial branch in a single transaction
    const agent = await db.transaction(async (tx) => {
      const [createdAgent] = await tx
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
      if (!createdAgent)
        throw status(
          409,
          "Agent with this name already exists" satisfies AgentsModel.AlreadyExists,
        );

      await BranchService.createInitialBranch(
        createdAgent.id,
        defaultModel,
        auditFields,
        tx,
      );

      return createdAgent;
    });

    return agent;
  },

  async listAgents() {
    const agentList = await db
      .select()
      .from(agents)
      .where(isNull(agents.deletedAt))
      .orderBy(asc(agents.createdAt));
    return agentList;
  },

  async getAgentBySlug(agentSlug: string) {
    const [agent] = await db
      .select()
      .from(agents)
      .where(and(eq(agents.slug, agentSlug), isNull(agents.deletedAt)));

    if (!agent) {
      throw status(404, "Agent not found" satisfies AgentsModel.NotFound);
    }
    return agent;
  },

  async updateAgent(
    agentSlug: string,
    input: AgentsModel.UpdateBody,
    auditFields: AuditFields,
  ) {
    const [agent] = await db
      .update(agents)
      .set({ ...input, updatedBy: auditFields.updatedBy })
      .where(and(eq(agents.slug, agentSlug), isNull(agents.deletedAt)))
      .returning();

    if (!agent) {
      throw status(404, "Agent not found" satisfies AgentsModel.NotFound);
    }
    return agent;
  },

  async softDeleteAgent(agentSlug: string, auditFields: AuditFields) {
    const deletedAt = new Date();

    await db
      .update(agents)
      .set({ deletedBy: auditFields.deletedBy, deletedAt })
      .where(and(eq(agents.slug, agentSlug), isNull(agents.deletedAt)));
  },
};
