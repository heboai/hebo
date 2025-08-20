import { and, eq, isNull } from "drizzle-orm";
import { Elysia, status } from "elysia";

import { agents } from "@hebo/db/schema/agents";

import { getDb } from "~/utils/request-db";

export const agentId = new Elysia({ name: "agent-id" })
  .derive(async ({ params }) => {
    const agentSlug = (params as { agentSlug?: string }).agentSlug;

    if (!agentSlug) throw status(400, "agentSlug is required");

    const [agent] = await getDb()
      .select({ id: agents.id })
      .from(agents)
      .where(and(eq(agents.slug, agentSlug), isNull(agents.deletedAt)))
      .limit(1);

    if (!agent) throw status(404, "Agent not found");

    return { agentId: agent.id } as const;
  })
  .as("scoped");
