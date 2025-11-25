import type { ProviderName } from "@hebo/database/src/types/providers";
import supportedModels from "@hebo/shared-data/json/supported-models";

import type { Provider } from "ai";

export interface ProviderAdapter {
  provider: Provider;
  resolveModelId(): Promise<string>;
}

export abstract class ProviderAdapterBase {
  protected constructor(
    private readonly providerName: ProviderName,
    private readonly modelName: string,
  ) {}

  protected abstract getProvider(): Promise<Provider>;

  protected abstract resolveModelId(): Promise<string>;

  async create(): Promise<ProviderAdapter> {
    return {
      provider: await this.getProvider(),
      resolveModelId: () => this.resolveModelId(),
    };
  }

  async getProviderModelId(): Promise<string> {
    const entry = supportedModels
      .find((model) => model.name === this.modelName)
      ?.providers.find((provider) => this.providerName in provider) as
      | Record<ProviderName, string>
      | undefined;
    if (!entry) {
      throw new Error(
        `Missing provider ${this.providerName} for model ${this.modelName}`,
      );
    }
    return entry[this.providerName];
  }
}
