import type { createDbClient } from "@hebo/database/client";
import supportedModels from "@hebo/shared-data/json/supported-models";
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

  private resolveModelConfig(type: Models[number]["type"]) {
    const config = supportedModels.find((model) => model.name === type);
    if (!config) {
      throw new Error(`Unsupported model type ${type}`);
    }
    return config;
  }

  async resolve(modelAliasPath: string) {
    const { type, customProviderName } =
      await this.resolveModelTypeAndCustomProvider(modelAliasPath);
    const modelConfig = this.resolveModelConfig(type);

    return {
      modelName: modelConfig.name,
      modelModality: modelConfig.modality,
      customProviderName,
    };
  }
}
