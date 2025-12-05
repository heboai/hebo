import type {
  ProviderConfig,
  ProviderSlug,
} from "@hebo/database/src/types/providers";
import supportedModels from "@hebo/shared-data/json/supported-models";
import { getReasoningConfig } from "@hebo/shared-data/models/index";

import type { OpenAICompatibleReasoning } from "~gateway/utils/openai-compatible-api-schemas";

import type { Provider } from "ai";

export interface ProviderAdapter {
  initialize(config?: ProviderConfig): Promise<this>;
  getProvider(): Promise<Provider>;
  resolveModelId(): Promise<string>;
  getProviderOptions(reasoning?: OpenAICompatibleReasoning): any;
}

export abstract class ProviderAdapterBase {
  protected constructor(
    private readonly providerSlug: ProviderSlug,
    private readonly modelName: string,
  ) {}

  protected getProviderName(): string {
    return this.providerSlug;
  }

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

  getProviderOptions(reasoning?: OpenAICompatibleReasoning): any {
    if (!reasoning) return;
    const config = getReasoningConfig(this.modelName, reasoning);
    if (!config) return;
    return { [this.getProviderName()]: config };
  }
}
