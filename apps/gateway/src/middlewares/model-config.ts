import type { createDbClient } from "@hebo/database/client";
import type { Models } from "@hebo/shared-data/types/models";

export class ModelConfigService {
  constructor(private readonly dbClient: ReturnType<typeof createDbClient>) {}

  private model?: Models[number];

  async getModelType(modelAliasPath: string) {
    const model = await this.getModel(modelAliasPath);
    return model.type;
  }

  async getCustomProviderName(modelAliasPath: string) {
    const model = await this.getModel(modelAliasPath);
    return model.routing?.only?.[0];
  }

  private async getModel(modelAliasPath: string) {
    if (!this.model) {
      this.model = await this.fetchModel(modelAliasPath);
    }
    return this.model;
  }

  private async fetchModel(modelAliasPath: string) {
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

    return model;
  }
}
