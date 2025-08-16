import { and, eq, isNull } from "drizzle-orm";
import { NotFoundError } from "elysia";

import { db } from "@hebo/db";
import { agents } from "@hebo/db/schema/agents";

export const verifyAgent = async (agentSlug: string) => {
  const [agent] = await db
    .select()
    .from(agents)
    .where(and(eq(agents.slug, agentSlug), isNull(agents.deletedAt)));

  if (!agent) {
    throw new NotFoundError("Agent not found");
  }

  return agent;
};
