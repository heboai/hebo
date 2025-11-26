import type { createDbClient } from "@hebo/database/client";
import type {
  ApiKeyProviderConfigValue,
  BedrockProviderConfigValue,
  VertexProviderConfigValue,
  ProviderConfigValue,
  ProviderSlug,
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
    const providerSlugs = [
      ...new Set(
        supportedModels
          .find((model) => model.type === modelType)
          ?.providers.flatMap(
            (mapping) => Object.keys(mapping) as ProviderSlug[],
          ),
      ),
    ];

    for (const providerSlug of providerSlugs) {
      try {
        return await this.createAdapter(providerSlug, modelType);
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
    providerSlug: ProviderSlug,
  ): Promise<ProviderAdapter> {
    const { value: config } =
      await this.dbClient.provider_configs.getUnredacted(providerSlug);
    return await this.createAdapter(
      providerSlug,
      modelType,
      config as ProviderConfigValue,
    );
  }

  private async createAdapter(
    providerSlug: ProviderSlug,
    modelType: string,
    config?: ProviderConfigValue,
  ) {
    switch (providerSlug) {
      case "bedrock": {
        return new BedrockProviderAdapter(modelType).initialize(
          config as BedrockProviderConfigValue | undefined,
        );
      }
      case "cohere": {
        return new CohereProviderAdapter(modelType).initialize(
          config as ApiKeyProviderConfigValue | undefined,
        );
      }
      case "groq": {
        return new GroqProviderAdapter(modelType).initialize(
          config as ApiKeyProviderConfigValue | undefined,
        );
      }
      case "vertex": {
        return new VertexProviderAdapter(modelType).initialize(
          config as VertexProviderConfigValue | undefined,
        );
      }
      default: {
        throw new Error(`Unsupported provider: ${providerSlug}`);
      }
    }
  }
}
