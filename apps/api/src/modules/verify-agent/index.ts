import { and, eq, isNull } from "drizzle-orm";
import { Elysia, status } from "elysia";

import { db } from "@hebo/db";
import { agents } from "@hebo/db/schema/agents";

export const verifyAgent = new Elysia({ name: "verify-agent" })
  .derive(async ({ params }) => {
    const agentSlug = (params as { agentSlug?: string }).agentSlug;

    if (!agentSlug) throw status(400, "agentSlug is required");

    const [agent] = await db
      .select()
      .from(agents)
      .where(and(eq(agents.slug, agentSlug), isNull(agents.deletedAt)));

    if (!agent) throw status(404, "Agent not found");

    return { agentId: agent.id } as const;
  })
  .as("scoped");
