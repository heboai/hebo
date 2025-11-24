import { createGroq } from "@ai-sdk/groq";

import type { ApiKeyProviderConfig } from "@hebo/database/src/types/providers";
import { getSecret } from "@hebo/shared-api/utils/secrets";

import { ProviderAdapterBase, type ModelConfig } from "./providers";

import type { Provider } from "ai";

export class GroqProviderAdapter extends ProviderAdapterBase {
  private readonly configPromise: Promise<ApiKeyProviderConfig>;
  readonly provider: Promise<Provider>;

  constructor(config?: ApiKeyProviderConfig) {
    super("groq");
    this.configPromise = config
      ? Promise.resolve(config)
      : getSecret("GroqApiKey").then((apiKey) => ({ apiKey }));
    this.provider = this.buildAiProvider();
  }

  private async buildAiProvider(): Promise<Provider> {
    const cfg = await this.configPromise;
    return createGroq({ ...cfg });
  }

  async resolveModelId(model: ModelConfig) {
    return this.getProviderModelId(model);
  }
}
