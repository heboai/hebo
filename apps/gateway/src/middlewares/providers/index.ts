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

export class ProviderAdapterFactory {
  constructor(private readonly dbClient: ReturnType<typeof createDbClient>) {}

  async create(
    modelConfig: ModelConfig,
    customProviderName?: ProviderName,
  ): Promise<ProviderAdapter> {
    const providerNames = customProviderName
      ? [customProviderName]
      : this.resolveProviderNames(modelConfig);

    const customProviderConfig = customProviderName
      ? await this.resolveCustomProviderConfig(customProviderName)
      : undefined;

    for (const providerName of providerNames) {
      try {
        const adapter = this.createAdapter(providerName, customProviderConfig);
        return await adapter.create(modelConfig);
      } catch {
        continue;
      }
    }
    throw new Error(
      `Unable to create provider adapter: no providers available`,
    );
  }

  private resolveProviderNames(modelConfig: ModelConfig): ProviderName[] {
    return [
      ...new Set(
        modelConfig.providers.flatMap(
          (mapping) => Object.keys(mapping) as ProviderName[],
        ),
      ),
    ];
  }

  private async resolveCustomProviderConfig(
    customProviderName: ProviderName,
  ): Promise<ProviderConfig | undefined> {
    const provider =
      await this.dbClient.providers.getUnredacted(customProviderName);
    return provider.config as ProviderConfig;
  }

  private createAdapter(
    providerName: ProviderName,
    config: ProviderConfig | undefined,
  ) {
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
  }
}
