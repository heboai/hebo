import type { createDbClient } from "@hebo/database/client";
import type {
  ApiKeyProviderConfig,
  AwsProviderConfig,
  GoogleProviderConfig,
  ProviderConfig,
  ProviderName,
} from "@hebo/database/src/types/providers";

import { BedrockProviderAdapter } from "./bedrock";
import { GroqProviderAdapter } from "./groq";
import { VertexProviderAdapter } from "./vertex";

export class ProviderAdapterService {
  constructor(private readonly dbClient: ReturnType<typeof createDbClient>) {}

  private async getCustomProviderConfig(providerName: ProviderName) {
    const record = await this.dbClient.providers.getUnredacted(providerName);
    return record.config as ProviderConfig;
  }

  async create(providerName: ProviderName, useCustomConfig: boolean) {
    const providerConfig = useCustomConfig
      ? await this.getCustomProviderConfig(providerName)
      : undefined;
    switch (providerName) {
      case "bedrock": {
        return new BedrockProviderAdapter(
          providerConfig as AwsProviderConfig | undefined,
        );
      }
      case "vertex": {
        return new VertexProviderAdapter(
          providerConfig as GoogleProviderConfig | undefined,
        );
      }
      case "groq": {
        return new GroqProviderAdapter(
          providerConfig as ApiKeyProviderConfig | undefined,
        );
      }
      default: {
        throw new Error(`Unsupported provider: ${providerName}`);
      }
    }
  }
}
