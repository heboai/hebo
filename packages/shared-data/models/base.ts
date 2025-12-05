import { ProviderSlug } from "@hebo/database/src/types/providers";

export interface ModelProviderMap {
  [providerSlug: string]: string;
}

export interface ModelDefinition {
  type: string;
  displayName: string;
  rateLimit: number;
  providers: ModelProviderMap[];
  modality: "chat" | "embedding";
  family: string;
  routing?: {
    only: ProviderSlug[];
  };
}

export interface OpenAICompatibleReasoning {
  enabled?: boolean;
  max_tokens?: number;
  effort?: "low" | "medium" | "high";
  exclude?: boolean;
}

export const DEFAULT_RATE_LIMIT = 400_000_000;

export const defineModel = (model: ModelDefinition): ModelDefinition => model;
