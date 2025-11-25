import { createGroq } from "@ai-sdk/groq";

import type { ApiKeyProviderConfig } from "@hebo/database/src/types/providers";
import { getSecret } from "@hebo/shared-api/utils/secrets";

import { ProviderAdapterBase } from "./providers";

import type { Provider } from "ai";

export class GroqProviderAdapter extends ProviderAdapterBase {
  private readonly configPromise: Promise<ApiKeyProviderConfig>;
  private providerPromise?: Promise<Provider>;

  constructor(modelName: string, config?: ApiKeyProviderConfig) {
    super("groq", modelName);
    this.configPromise = config
      ? Promise.resolve(config)
      : getSecret("GroqApiKey").then((apiKey) => ({ apiKey }));
  }

  private async buildAiProvider(): Promise<Provider> {
    const cfg = await this.configPromise;
    return createGroq({ ...cfg });
  }

  protected async getProvider(): Promise<Provider> {
    if (!this.providerPromise) {
      this.providerPromise = this.buildAiProvider();
    }
    return this.providerPromise;
  }

  protected async resolveModelId() {
    return this.getProviderModelId();
  }
}
