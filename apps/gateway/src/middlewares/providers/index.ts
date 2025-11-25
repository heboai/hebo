import type { createDbClient } from "@hebo/database/client";
import type {
  ApiKeyProviderConfig,
  AwsProviderConfig,
  GoogleProviderConfig,
  ProviderConfig,
  ProviderName,
} from "@hebo/database/src/types/providers";
import supportedModels from "@hebo/shared-data/json/supported-models";

import { BedrockProviderAdapter } from "./bedrock";
import { GroqProviderAdapter } from "./groq";
import { VertexProviderAdapter } from "./vertex";

import type { ProviderAdapter } from "./providers";

export class ProviderAdapterFactory {
  constructor(private readonly dbClient: ReturnType<typeof createDbClient>) {}

  async createDefault(modelType: string): Promise<ProviderAdapter> {
    const providerNames = this.resolveProviderNames(modelType);

    for (const providerName of providerNames) {
      try {
        const adapter = this.createAdapter(providerName, modelType);
        return await adapter.create();
      } catch {
        continue;
      }
    }
    throw new Error(
      `Unable to create provider adapter: no providers available`,
    );
  }

  async createCustom(
    modelType: string,
    providerName: ProviderName,
  ): Promise<ProviderAdapter> {
    const providerConfig = await this.resolveCustomProviderConfig(providerName);
    const adapter = this.createAdapter(providerName, modelType, providerConfig);
    return await adapter.create();
  }

  private resolveProviderNames(modelType: string): ProviderName[] {
    return [
      ...new Set(
        supportedModels
          .find((model) => model.type === modelType)
          ?.providers.flatMap(
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
    modelType: string,
    config?: ProviderConfig,
  ) {
    switch (providerName) {
      case "bedrock": {
        return new BedrockProviderAdapter(
          modelType,
          config as AwsProviderConfig | undefined,
        );
      }
      case "vertex": {
        return new VertexProviderAdapter(
          modelType,
          config as GoogleProviderConfig | undefined,
        );
      }
      case "groq": {
        return new GroqProviderAdapter(
          modelType,
          config as ApiKeyProviderConfig | undefined,
        );
      }
      default: {
        throw new Error(`Unsupported provider: ${providerName}`);
      }
    }
  }
}
