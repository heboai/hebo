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
  create(cfg?: ProviderConfig): Promise<AiProvider>;
  transformModelId(id: string, cfg?: ProviderConfig): Promise<string>;
}

class BedrockProvider implements Provider {
  private async getDefaultConfig(): Promise<AwsProviderConfig> {
    return getBedrockDefaultConfig();
  }

  async create(cfg?: AwsProviderConfig): Promise<AiProvider> {
    const resolvedConfig = cfg ?? (await this.getDefaultConfig());
    return createBedrockProvider(resolvedConfig);
  }

  async transformModelId(id: string, cfg?: AwsProviderConfig): Promise<string> {
    const resolvedCfg = cfg ?? (await this.getDefaultConfig());
    return transformBedrockModelId(id, resolvedCfg);
  }
}

class VertexProvider implements Provider {
  private async getDefaultConfig(): Promise<GoogleProviderConfig> {
    return getVertexDefaultConfig();
  }

  async create(cfg?: GoogleProviderConfig): Promise<AiProvider> {
    const resolvedConfig = cfg ?? (await this.getDefaultConfig());
    return createVertexProvider(resolvedConfig);
  }

  async transformModelId(id: string): Promise<string> {
    return transformVertexModelId(id);
  }
}

class GroqProvider implements Provider {
  private async getDefaultConfig(): Promise<ApiKeyProviderConfig> {
    return getGroqDefaultConfig();
  }

  async create(cfg?: ApiKeyProviderConfig): Promise<AiProvider> {
    const resolvedConfig = cfg ?? (await this.getDefaultConfig());
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
