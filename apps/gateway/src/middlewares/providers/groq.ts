import { createGroq } from "@ai-sdk/groq";

import type { ApiKeyProviderConfig } from "@hebo/database/src/types/providers";
import { getSecret } from "@hebo/shared-api/utils/secrets";

import { ProviderAdapterBase, type ProviderAdapter } from "./provider";

export class GroqProviderAdapter
  extends ProviderAdapterBase
  implements ProviderAdapter
{
  private config?: ApiKeyProviderConfig;

  constructor(modelName: string) {
    super("groq", modelName);
  }

  private async getConfig(): Promise<ApiKeyProviderConfig> {
    if (!this.config) {
      throw new Error("Missing Groq provider config. Call initialize() first.");
    }
    return this.config;
  }

  async initialize(config?: ApiKeyProviderConfig): Promise<this> {
    if (config) {
      this.config = config;
    } else {
      const apiKey = await getSecret("GroqApiKey");
      this.config = { apiKey };
    }
    return this;
  }

  async getProvider() {
    const cfg = await this.getConfig();
    return createGroq({ ...cfg });
  }

  async resolveModelId() {
    return this.getProviderModelId();
  }
}
