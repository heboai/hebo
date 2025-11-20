import type {
  ApiKeyProviderConfig,
  AwsProviderConfig,
  GoogleProviderConfig,
  ProviderConfig,
  ProviderName,
} from "@hebo/database/src/types/providers";

import { BedrockProvider } from "./bedrock";
import { GroqProvider } from "./groq";
import { VertexProvider } from "./vertex";

import type { Provider } from "./types";

export const createProvider = (
  providerName: ProviderName,
  providerConfig?: ProviderConfig,
): Provider => {
  switch (providerName) {
    case "bedrock": {
      return new BedrockProvider(
        providerConfig as AwsProviderConfig | undefined,
      );
    }
    case "vertex": {
      return new VertexProvider(
        providerConfig as GoogleProviderConfig | undefined,
      );
    }
    case "groq": {
      return new GroqProvider(
        providerConfig as ApiKeyProviderConfig | undefined,
      );
    }
    default: {
      throw new Error(`Unsupported provider: ${providerName}`);
    }
  }
};
