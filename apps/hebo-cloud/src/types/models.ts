export interface SupportedModel {
  id: string;
  name: string;
  provider: string;
  freeTokensPerMonth: number; // Number of free tokens per month
}

export interface ModelsConfig {
  models: SupportedModel[];
} 