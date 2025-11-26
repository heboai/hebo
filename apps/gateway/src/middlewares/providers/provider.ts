import type {
  ProviderConfig,
  ProviderSlug,
} from "@hebo/database/src/types/providers";
import supportedModels from "@hebo/shared-data/json/supported-models";

import type { Provider } from "ai";

export interface ProviderAdapter {
  initialize(config?: ProviderConfig): Promise<this>;
  getProvider(): Promise<Provider>;
  resolveModelId(): Promise<string>;
}

export abstract class ProviderAdapterBase {
  protected constructor(
    private readonly providerSlug: ProviderSlug,
    private readonly modelName: string,
  ) {}

  getProviderModelId(): string {
    const entry = supportedModels
      .find((model) => model.type === this.modelName)
      ?.providers.find((provider) => this.providerSlug in provider) as
      | Record<ProviderSlug, string>
      | undefined;
    if (!entry) {
      throw new Error(
        `Missing provider ${this.providerSlug} for model ${this.modelName}`,
      );
    }
    return entry[this.providerSlug];
  }
}
