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

import type { ModelConfig, ProviderAdapter } from "./providers";

export class ProviderAdapterService {
  constructor(private readonly dbClient: ReturnType<typeof createDbClient>) {}

  async resolve(
    providerName: ProviderName,
    useCustomConfig: boolean,
    model: ModelConfig,
  ): Promise<ProviderAdapter> {
    let config: ProviderConfig | undefined;

    if (useCustomConfig) {
      const provider =
        await this.dbClient.providers.getUnredacted(providerName);
      config = provider.config as ProviderConfig;
    }

    const adapter = (() => {
      switch (providerName) {
        case "bedrock": {
          return new BedrockProviderAdapter(
            config as AwsProviderConfig | undefined,
          );
        }
        case "vertex": {
          return new VertexProviderAdapter(
            config as GoogleProviderConfig | undefined,
          );
        }
        case "groq": {
          return new GroqProviderAdapter(
            config as ApiKeyProviderConfig | undefined,
          );
        }
        default: {
          throw new Error(`Unsupported provider: ${providerName}`);
        }
      }
    })();

    return adapter.create(model);
  }
}
