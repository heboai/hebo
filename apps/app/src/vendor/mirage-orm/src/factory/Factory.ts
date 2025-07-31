import { type AllowedIdTypes } from '@src/db';
import type { ModelAttrs } from '@src/model';

import BaseFactory, { type FactoryAttrs, type FactoryDefinition } from './BaseFactory';

/**
 * Factory class for creating factories.
 */
export default class Factory {
  /**
   * Define a factory.
   * @param definition - The attributes, traits, and afterCreate hook to define the factory.
   * @returns The factory.
   */
  static define<TAttrs extends ModelAttrs<AllowedIdTypes>>(
    definition: FactoryDefinition<TAttrs>,
  ): BaseFactory<TAttrs> {
    const { attributes, traits, afterCreate } = definition;
    return new BaseFactory<TAttrs>(attributes, traits, afterCreate);
  }

  /**
   * Extend a factory.
   * @param factory - The factory to extend.
   * @param definition - The new attributes, traits, and afterCreate hook to add or override.
   * @returns The extended factory.
   */
  static extend<TAttrs extends ModelAttrs<AllowedIdTypes>>(
    factory: BaseFactory<TAttrs>,
    definition: Partial<FactoryDefinition<TAttrs>>,
  ): BaseFactory<TAttrs> {
    const { attributes = {}, traits = {} } = definition;

    // Merge attributes, with new attributes taking precedence
    const mergedAttributes = {
      ...factory.attributes,
      ...attributes,
    };

    // Merge traits, with new traits taking precedence
    const mergedTraits = {
      ...factory.traits,
      ...traits,
    };

    // Create new factory with merged attributes and traits
    return new BaseFactory<TAttrs>(
      mergedAttributes as FactoryAttrs<TAttrs>,
      mergedTraits,
      definition.afterCreate || factory.afterCreate,
    );
  }
}
