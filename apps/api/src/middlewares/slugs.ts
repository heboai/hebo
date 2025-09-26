import { Elysia, status } from "elysia";

import * as Repository from "@hebo/database/repository";
import { authService } from "@hebo/shared-api/auth/auth-service";

// TODO: Is this needed?
export const agentSlug = new Elysia({ name: "agent-slug" })
  .use(authService)
  .resolve(async ({ params, userId }) => {
    const agentSlug = (params as { agentSlug: string }).agentSlug;
    const agent = await Repository.getAgentBySlug(agentSlug, userId!);
    if (!agent) throw status(404, "Agent not found");
    return { agentSlug: agent.slug } as const;
  })
  .as("scoped");

export const branchSlug = new Elysia({ name: "branch-slug" })
  .use(authService)
  .use(agentSlug)
  .resolve(async ({ params, userId, agentSlug }) => {
    const branchSlug = (params as { branchSlug: string }).branchSlug;
    const branch = await Repository.getBranchBySlug(
      agentSlug,
      branchSlug,
      userId!,
    );
    if (!branch) throw status(404, "Branch not found");
    return { branchSlug: branch.slug } as const;
  })
  .as("scoped");
