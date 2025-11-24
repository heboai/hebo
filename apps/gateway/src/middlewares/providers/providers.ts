import type { ProviderName } from "@hebo/database/src/types/providers";
import supportedModels from "@hebo/shared-data/json/supported-models";

import type { Provider } from "ai";

export type ModelConfig = (typeof supportedModels)[number];

export interface ProviderAdapter {
  provider: Promise<Provider>;
  resolveModelId(model: ModelConfig): Promise<string>;
}

export abstract class ProviderAdapterBase implements ProviderAdapter {
  abstract readonly provider: Promise<Provider>;

  protected constructor(private readonly providerName: ProviderName) {}

  protected getProviderModelId(model: ModelConfig) {
    const entry = model.providers.find(
      (provider) => this.providerName in provider,
    ) as Record<ProviderName, string> | undefined;
    if (!entry) {
      throw new Error(
        `Missing provider ${this.providerName} for model ${model.name}`,
      );
    }
    return entry[this.providerName];
  }

  abstract resolveModelId(model: ModelConfig): Promise<string>;
}
