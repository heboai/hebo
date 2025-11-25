import type { ProviderName } from "@hebo/database/src/types/providers";
import supportedModels from "@hebo/shared-data/json/supported-models";

import type { Provider } from "ai";

export interface ProviderAdapter {
  getProvider(): Promise<Provider>;
  resolveModelId(): Promise<string>;
}

export abstract class ProviderAdapterBase {
  protected constructor(
    private readonly providerName: ProviderName,
    private readonly modelName: string,
  ) {}

  getProviderModelId(): string {
    const entry = supportedModels
      .find((model) => model.type === this.modelName)
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
