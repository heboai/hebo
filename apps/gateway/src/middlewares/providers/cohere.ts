import { createCohere } from "@ai-sdk/cohere";

import type { ApiKeyProviderConfigValue } from "@hebo/database/src/types/providers";
import { getSecret } from "@hebo/shared-api/utils/secrets";

import { ProviderAdapterBase, type ProviderAdapter } from "./provider";

export class CohereProviderAdapter
  extends ProviderAdapterBase
  implements ProviderAdapter
{
  private config?: ApiKeyProviderConfigValue;

  constructor(modelName: string) {
    super("cohere", modelName);
  }

  async initialize(config?: ApiKeyProviderConfigValue): Promise<this> {
    if (config) {
      this.config = config;
    } else {
      const apiKey = await getSecret("CohereApiKey");
      this.config = { apiKey };
    }
    return this;
  }

  async getProvider() {
    const cfg = this.config!;
    return createCohere({ ...cfg });
  }

  async resolveModelId() {
    return this.getProviderModelId();
  }
}
