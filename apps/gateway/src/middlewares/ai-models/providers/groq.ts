import { createGroq } from "@ai-sdk/groq";

import type { ApiKeyProviderConfig } from "@hebo/database/src/types/providers";
import { getSecret } from "@hebo/shared-api/utils/secrets";

import type { Provider } from "./types";
import type { Provider as AiProvider } from "ai";

const getGroqDefaultConfig = async (): Promise<ApiKeyProviderConfig> => ({
  apiKey: await getSecret("GroqApiKey"),
});

export class GroqProvider implements Provider {
  private readonly configPromise: Promise<ApiKeyProviderConfig>;

  constructor(config?: ApiKeyProviderConfig) {
    this.configPromise = config
      ? Promise.resolve(config)
      : getGroqDefaultConfig();
  }

  private async getConfig(): Promise<ApiKeyProviderConfig> {
    return this.configPromise;
  }

  async create(): Promise<AiProvider> {
    const cfg = await this.getConfig();
    return createGroq({ ...cfg });
  }

  async resolveModelId(id: string): Promise<string> {
    return id;
  }
}
