import type { createDbClient } from "@hebo/database/client";
import type { Models } from "@hebo/shared-api/types";

export class ModelNotFoundError extends Error {}

export const getModelId = async (
  dbClient: ReturnType<typeof createDbClient>,
  modelString: string,
) => {
  const [agentSlug, branchSlug, modelAlias] = modelString.split("/");
  // FUTURE: use cache to avoid multiple database calls
  const { models } = await dbClient.branches.findFirstOrThrow({
    where: { agent_slug: agentSlug, slug: branchSlug },
  });
  const model = (models as Models).find((m) => m?.alias === modelAlias)?.type;
  if (!model) throw new ModelNotFoundError();
  return model;
};
