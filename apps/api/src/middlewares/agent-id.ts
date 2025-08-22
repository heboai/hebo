import { eq } from "drizzle-orm";
import { Elysia, status } from "elysia";

import { agents } from "@hebo/db/schema/agents";
import { withAudit } from "@hebo/db/utils/with-audit";
import { authenticateUser } from "@hebo/shared-auth";

import { getDb } from "~/utils/request-db";

export const agentId = new Elysia({ name: "agent-id" })
  .use(authenticateUser())
  .derive(async ({ params, userId }) => {
    const agentSlug = (params as { agentSlug?: string }).agentSlug;

    if (!agentSlug) throw status(400, "agentSlug is required");

    const audit = withAudit(agents, { userId });
    const [agent] = await audit
      .select(getDb(), eq(agents.slug, agentSlug))
      .limit(1);

    if (!agent) throw status(404, "Agent not found");

    return { agentId: agent.id } as const;
  })
  .as("scoped");
