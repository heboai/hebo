import type { ProviderName } from "@hebo/database/src/types/providers";
import supportedModels from "@hebo/shared-data/json/supported-models";

import type { Provider } from "ai";

export type ModelConfig = (typeof supportedModels)[number];

export interface ProviderAdapter {
  provider: Provider;
  modelId: string;
}

export abstract class ProviderAdapterBase {
  protected constructor(private readonly providerName: ProviderName) {}

  protected abstract getProvider(): Promise<Provider>;

  protected abstract resolveModelId(model: ModelConfig): Promise<string>;

  async create(model: ModelConfig): Promise<ProviderAdapter> {
    const [provider, modelId] = await Promise.all([
      this.getProvider(),
      this.resolveModelId(model),
    ]);
    return { provider, modelId };
  }

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
}
