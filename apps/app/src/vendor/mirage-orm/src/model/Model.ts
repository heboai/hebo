import { AllowedIdTypes } from '@src/db';

import BaseModel, { type ModelAttrs, type ModelClass } from './BaseModel';

/**
 * Model class that provides static methods for model management
 */
export default class Model {
  /**
   * Creates a new model class with attribute accessors, or extends an existing model class
   * @param ModelClass - The model class to enhance. If not provided, a base model class will be used.
   * @returns An enhanced model class that can be instantiated with 'new'
   */
  static define<TAttrs extends ModelAttrs<AllowedIdTypes> = ModelAttrs<string>>(
    ModelClass: ModelClass<TAttrs> = BaseModel.create<TAttrs>(),
  ): ModelClass<TAttrs> {
    return ModelClass as ModelClass<TAttrs>;
  }
}
