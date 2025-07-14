export interface SupportedModel {
  modelName: string;
  freeTokensPerMonth: number;
}

export type ModelsConfig = SupportedModel[]; 