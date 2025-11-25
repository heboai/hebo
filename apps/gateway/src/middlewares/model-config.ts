import type { createDbClient } from "@hebo/database/client";
import type { ProviderName } from "@hebo/database/src/types/providers";
import supportedModels from "@hebo/shared-data/json/supported-models";
import type { Models } from "@hebo/shared-data/types/models";

export class ModelConfigService {
  constructor(private readonly dbClient: ReturnType<typeof createDbClient>) {}

  private async resolveModelTypeAndCustomProvider(fullModelAlias: string) {
    const [agentSlug, branchSlug, modelAlias] = fullModelAlias.split("/");
    const branch = await this.dbClient.branches.findFirstOrThrow({
      where: { agent_slug: agentSlug, slug: branchSlug },
      select: { models: true },
    });
    const model = (branch.models as Models)?.find(
      ({ alias }) => alias === modelAlias,
    );
    if (!model) {
      throw new Error(`Missing model config for alias ${fullModelAlias}`);
    }
    // Currently, we only support routing to the first provider.
    const customProvider = model.routing?.only?.[0];
    return { type: model.type, customProvider };
  }

  private resolveModelConfig(type: Models[number]["type"]) {
    const config = supportedModels.find((model) => model.name === type);
    if (!config) {
      throw new Error(`Unsupported model type ${type}`);
    }
    return config;
  }

  private resolveProviderName(modelConfig: (typeof supportedModels)[number]) {
    // Currently, we only support routing to the first provider.
    const provider = modelConfig.providers[0];
    return Object.keys(provider)[0] as ProviderName;
  }

  async resolve(fullModelAlias: string) {
    const { type, customProvider } =
      await this.resolveModelTypeAndCustomProvider(fullModelAlias);
    const modelConfig = this.resolveModelConfig(type);
    const providerName =
      customProvider ?? this.resolveProviderName(modelConfig);

    return {
      modelConfig,
      providerName,
      useCustomProvider: !!customProvider,
    };
  }
}
