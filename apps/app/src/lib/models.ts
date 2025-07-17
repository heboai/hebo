import modelsConfig from '../config/supported-models.json';
import { SupportedModel } from '../types/models';

export const getSupportedModels = (): SupportedModel[] => {
  return modelsConfig;
}; 