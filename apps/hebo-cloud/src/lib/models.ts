import modelsConfig from '@/config/supported-models.json';
import { ModelsConfig, SupportedModel } from '@/types/models';

export const getSupportedModels = (): SupportedModel[] => {
  return (modelsConfig as ModelsConfig).models;
};

export const getModelById = (id: string): SupportedModel | undefined => {
  return getSupportedModels().find(model => model.id === id);
}; 