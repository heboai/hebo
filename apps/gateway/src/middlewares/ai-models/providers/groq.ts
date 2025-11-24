import { createGroq } from "@ai-sdk/groq";

import type { ApiKeyProviderConfig } from "@hebo/database/src/types/providers";
import { getSecret } from "@hebo/shared-api/utils/secrets";

import type { Provider } from "./providers";
import type { Provider as AiProvider } from "ai";

export class GroqProvider implements Provider {
  private readonly configPromise: Promise<ApiKeyProviderConfig>;

  constructor(config?: ApiKeyProviderConfig) {
    this.configPromise = config
      ? Promise.resolve(config)
      : getSecret("GroqApiKey").then((apiKey) => ({ apiKey }));
  }

  async create(): Promise<AiProvider> {
    const cfg = await this.configPromise;
    return createGroq({ ...cfg });
  }

  async resolveModelId(id: string): Promise<string> {
    return id;
  }
}
