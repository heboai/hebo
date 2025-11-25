import { createGroq } from "@ai-sdk/groq";

import type { ApiKeyProviderConfig } from "@hebo/database/src/types/providers";
import { getSecret } from "@hebo/shared-api/utils/secrets";

import { ProviderAdapterBase } from "./providers";

import type { Provider } from "ai";

export class GroqProviderAdapter extends ProviderAdapterBase {
  private readonly configPromise: Promise<ApiKeyProviderConfig>;

  constructor(modelName: string, config?: ApiKeyProviderConfig) {
    super("groq", modelName);
    this.configPromise = config
      ? Promise.resolve(config)
      : getSecret("GroqApiKey").then((apiKey) => ({ apiKey }));
  }

  async getProvider(): Promise<Provider> {
    const cfg = await this.configPromise;
    return createGroq({ ...cfg });
  }

  async resolveModelId() {
    return this.getProviderModelId();
  }
}
