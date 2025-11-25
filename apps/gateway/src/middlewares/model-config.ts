import type { createDbClient } from "@hebo/database/client";
import type { Models } from "@hebo/shared-data/types/models";

export class ModelConfigService {
  constructor(private readonly dbClient: ReturnType<typeof createDbClient>) {}

  private async resolveModelTypeAndCustomProvider(modelAliasPath: string) {
    const [agentSlug, branchSlug, modelAlias] = modelAliasPath.split("/");
    const branch = await this.dbClient.branches.findFirstOrThrow({
      where: { agent_slug: agentSlug, slug: branchSlug },
      select: { models: true },
    });
    const model = (branch.models as Models)?.find(
      ({ alias }) => alias === modelAlias,
    );
    if (!model) {
      throw new Error(`Missing model config for alias path ${modelAliasPath}`);
    }
    // Currently, we only support routing to the first provider.
    const customProviderName = model.routing?.only?.[0];
    return { type: model.type, customProviderName };
  }

  async resolve(modelAliasPath: string) {
    const { type, customProviderName } =
      await this.resolveModelTypeAndCustomProvider(modelAliasPath);

    return {
      modelType: type,
      customProviderName,
    };
  }
}
