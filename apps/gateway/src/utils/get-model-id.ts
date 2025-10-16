import type { createDbClient } from "@hebo/database/client";
import { modelsSchema } from "@hebo/shared-api/types";

export class ModelNotFoundError extends Error {}

export const getModelId = async (
  dbClient: ReturnType<typeof createDbClient>,
  modelString: string,
) => {
  const [agentSlug, branchSlug, modelAlias] = modelString.split("/");
  // FUTURE: use cache to avoid multiple database calls
  const branch = await dbClient.branches.findFirstOrThrow({
    where: { agent_slug: agentSlug, slug: branchSlug },
  });
  const models = branch.models as typeof modelsSchema.static;
  const model = models.find((m) => m?.alias === modelAlias);
  if (!model?.type) {
    throw new ModelNotFoundError();
  }
  return model.type;
};
