import type { createDbClient } from "@hebo/database/client";

export class ModelNotFoundError extends Error {}

export const getModelObject = async (
  dbClient: ReturnType<typeof createDbClient>,
  modelString: string,
) => {
  const [agentSlug, branchSlug, modelAlias] = modelString.split("/");
  // FUTURE: use cache to avoid multiple database calls
  const models = await dbClient.branches.getFullModels({
    agent_slug: agentSlug,
    slug: branchSlug,
  });
  const foundModel = models.find((m) => m?.alias === modelAlias);
  if (!foundModel) throw new ModelNotFoundError();
  return foundModel;
};
