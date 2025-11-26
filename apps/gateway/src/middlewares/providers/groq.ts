import { createGroq } from "@ai-sdk/groq";

import type { ApiKeyProviderConfigValue } from "@hebo/database/src/types/providers";
import { getSecret } from "@hebo/shared-api/utils/secrets";

import { ProviderAdapterBase, type ProviderAdapter } from "./provider";

export class GroqProviderAdapter
  extends ProviderAdapterBase
  implements ProviderAdapter
{
  private config?: ApiKeyProviderConfigValue;

  constructor(modelName: string) {
    super("groq", modelName);
  }

  async initialize(config?: ApiKeyProviderConfigValue): Promise<this> {
    if (config) {
      this.config = config;
    } else {
      const apiKey = await getSecret("GroqApiKey");
      this.config = { apiKey };
    }
    return this;
  }

  async getProvider() {
    const cfg = this.config!;
    return createGroq({ ...cfg });
  }

  async resolveModelId() {
    return this.getProviderModelId();
  }
}
