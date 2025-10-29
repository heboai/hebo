import type { createDbClient } from "@hebo/database/client";
import type { Models } from "@hebo/shared-data/types/models";

export class ModelNotFoundError extends Error {}

export const getModelObject = async (
  dbClient: ReturnType<typeof createDbClient>,
  modelString: string,
) => {
  const [agentSlug, branchSlug, modelAlias] = modelString.split("/");
  const result = await dbClient.branches.findFirstOrThrow({
    where: { agent_slug: agentSlug, slug: branchSlug },
    select: { models: true },
  });
  const foundModel = (result.models as Models)?.find(
    (m) => m?.alias === modelAlias,
  );
  if (!foundModel) throw new ModelNotFoundError();
  return foundModel;
};
