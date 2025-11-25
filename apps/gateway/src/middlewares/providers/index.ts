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
    const providerNames = [
      ...new Set(
        supportedModels
          .find((model) => model.type === modelType)
          ?.providers.flatMap(
            (mapping) => Object.keys(mapping) as ProviderName[],
          ),
      ),
    ];

    for (const providerName of providerNames) {
      try {
        return this.createAdapter(providerName, modelType);
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
    const { config } =
      await this.dbClient.providers.getUnredacted(providerName);
    return this.createAdapter(
      providerName,
      modelType,
      config as ProviderConfig,
    );
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
