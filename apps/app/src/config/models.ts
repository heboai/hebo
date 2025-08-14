// TODO: replace with supported-models.json from db package
export interface SupportedModel {
  modelName: string;
  freeTokensPerMonth: number;
}

export const supportedModels: SupportedModel[] = [
  {
    modelName: "LLaMA 4 Scout",
    freeTokensPerMonth: 40_000_000,
  },
  {
    modelName: "Claude 4",
    freeTokensPerMonth: 40_000_000,
  },
  {
    modelName: "Voyage",
    freeTokensPerMonth: 40_000_000,
  },
];
