import type {
  ApiKeyProviderConfig,
  AwsProviderConfig,
  GoogleProviderConfig,
  ProviderConfig,
  ProviderName,
} from "@hebo/shared-data/types/providers";

import {
  getBedrockDefaultConfig,
  createBedrockProvider,
  transformBedrockModelId,
} from "./providers/bedrock";
import {
  getGroqDefaultConfig,
  createGroqProvider,
  transformGroqModelId,
} from "./providers/groq";
import {
  getVertexDefaultConfig,
  createVertexProvider,
  transformVertexModelId,
} from "./providers/vertex";

import type { Provider as AiProvider } from "ai";

interface Provider {
  resolveConfig(cfg?: ProviderConfig): Promise<ProviderConfig>;
  create(cfg?: ProviderConfig): Promise<AiProvider>;
  transformModelId(id: string, cfg?: ProviderConfig): Promise<string>;
}

class BedrockProvider implements Provider {
  async resolveConfig(cfg?: AwsProviderConfig): Promise<AwsProviderConfig> {
    return cfg ?? (await getBedrockDefaultConfig());
  }

  async create(cfg?: AwsProviderConfig): Promise<AiProvider> {
    const resolvedConfig = await this.resolveConfig(cfg);
    return createBedrockProvider(resolvedConfig);
  }

  async transformModelId(id: string, cfg?: AwsProviderConfig): Promise<string> {
    const resolvedCfg = await this.resolveConfig(cfg);
    return transformBedrockModelId(id, resolvedCfg);
  }
}

class VertexProvider implements Provider {
  async resolveConfig(
    cfg?: GoogleProviderConfig,
  ): Promise<GoogleProviderConfig> {
    return cfg ?? (await getVertexDefaultConfig());
  }

  async create(cfg?: GoogleProviderConfig): Promise<AiProvider> {
    const resolvedConfig = await this.resolveConfig(cfg);
    return createVertexProvider(resolvedConfig);
  }

  async transformModelId(id: string): Promise<string> {
    return transformVertexModelId(id);
  }
}

class GroqProvider implements Provider {
  async resolveConfig(
    cfg?: ApiKeyProviderConfig,
  ): Promise<ApiKeyProviderConfig> {
    return cfg ?? (await getGroqDefaultConfig());
  }

  async create(cfg?: ApiKeyProviderConfig): Promise<AiProvider> {
    const resolvedConfig = await this.resolveConfig(cfg);
    return createGroqProvider(resolvedConfig);
  }

  async transformModelId(id: string): Promise<string> {
    return transformGroqModelId(id);
  }
}

export const resolveProvider = (providerName: ProviderName): Provider => {
  switch (providerName) {
    case "bedrock": {
      return new BedrockProvider();
    }
    case "vertex": {
      return new VertexProvider();
    }
    case "groq": {
      return new GroqProvider();
    }
    default: {
      throw new Error(`Unsupported provider: ${providerName}`);
    }
  }
};
