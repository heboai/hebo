import { createGroq } from "@ai-sdk/groq";

import type { ApiKeyProviderConfig } from "@hebo/database/src/types/providers";
import { getSecret } from "@hebo/shared-api/utils/secrets";

import { ProviderAdapterBase, type ProviderAdapter } from "./provider";

export class GroqProviderAdapter
  extends ProviderAdapterBase
  implements ProviderAdapter
{
  private config?: ApiKeyProviderConfig;

  constructor(modelName: string, config?: ApiKeyProviderConfig) {
    super("groq", modelName);
    this.config = config;
  }

  private async getConfig(): Promise<ApiKeyProviderConfig> {
    if (!this.config) {
      const apiKey = await getSecret("GroqApiKey");
      this.config = { apiKey };
    }
    return this.config;
  }

  async getProvider() {
    const cfg = await this.getConfig();
    return createGroq({ ...cfg });
  }

  async resolveModelId() {
    return this.getProviderModelId();
  }
}
