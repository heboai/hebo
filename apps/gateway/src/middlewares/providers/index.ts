import type { createDbClient } from "@hebo/database/client";
import type {
  ApiKeyProviderConfig,
  BedrockProviderConfig,
  VertexProviderConfig,
  ProviderConfig,
  ProviderName,
} from "@hebo/database/src/types/providers";
import supportedModels from "@hebo/shared-data/json/supported-models";

import { BedrockProviderAdapter } from "./bedrock";
import { CohereProviderAdapter } from "./cohere";
import { GroqProviderAdapter } from "./groq";
import { VertexProviderAdapter } from "./vertex";

import type { ProviderAdapter } from "./provider";

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
        return await this.createAdapter(providerName, modelType);
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
    return await this.createAdapter(
      providerName,
      modelType,
      config as ProviderConfig,
    );
  }

  private async createAdapter(
    providerName: ProviderName,
    modelType: string,
    config?: ProviderConfig,
  ) {
    switch (providerName) {
      case "bedrock": {
        return new BedrockProviderAdapter(modelType).initialize(
          config as BedrockProviderConfig | undefined,
        );
      }
      case "cohere": {
        return new CohereProviderAdapter(modelType).initialize(
          config as ApiKeyProviderConfig | undefined,
        );
      }
      case "groq": {
        return new GroqProviderAdapter(modelType).initialize(
          config as ApiKeyProviderConfig | undefined,
        );
      }
      case "vertex": {
        return new VertexProviderAdapter(modelType).initialize(
          config as VertexProviderConfig | undefined,
        );
      }
      default: {
        throw new Error(`Unsupported provider: ${providerName}`);
      }
    }
  }
}
