import { type AllowedIdTypes } from '@src/db';
import type { ModelAttrs, ModelInstance } from '@src/model';
import { MirageError } from '@src/utils';

/**
 * Base factory that builds model attributes.
 */
export default class BaseFactory<TAttrs extends ModelAttrs<AllowedIdTypes>> {
  constructor(
    public readonly attributes: FactoryAttrs<TAttrs>,
    public readonly traits: Record<string, TraitDefinition<TAttrs>> = {},
    public readonly afterCreate?: (model: ModelInstance<TAttrs>) => void,
  ) {}

  /**
   * Build a model with the given model ID and trait names or default values.
   * @param modelId - The ID of the model to build.
   * @param traitsOrDefaults - The names of the traits to apply to the model or default values for attributes.
   * @returns The built model.
   */
  build(
    modelId: NonNullable<TAttrs['id']>,
    ...traitsOrDefaults: (string | Partial<TAttrs>)[]
  ): TAttrs {
    const traitNames: string[] = [];
    const defaults: Partial<TAttrs> = {};

    // Separate trait names from default values
    traitsOrDefaults.forEach((arg) => {
      if (typeof arg === 'string') {
        traitNames.push(arg);
      } else {
        Object.assign(defaults, arg);
      }
    });

    const processedAttributes = this.processAttributes(this.attributes, modelId);
    const traitAttributes = this.buildWithTraits(traitNames, modelId);

    // Merge attributes in order: defaults override traits, traits override base attributes
    return this.mergeAttributesWithId(this.mergeAttributes(processedAttributes, traitAttributes), {
      ...defaults,
      id: modelId,
    });
  }

  /**
   * Process the afterCreate hook and the trait hooks.
   * @param model - The model to process.
   * @param traitsOrDefaults - The traits or default values to use for the model.
   * @returns The processed model.
   */
  processAfterCreateHooks(
    model: ModelInstance<TAttrs>,
    ...traitsOrDefaults: (string | Partial<TAttrs>)[]
  ): ModelInstance<TAttrs> {
    const traitNames: string[] = traitsOrDefaults.filter((arg) => typeof arg === 'string');
    const hooks: ((model: ModelInstance<TAttrs>) => void)[] = [];

    if (this.afterCreate) {
      hooks.push(this.afterCreate);
    }

    traitNames.forEach((name) => {
      const trait = this.traits[name];

      if (trait?.afterCreate) {
        hooks.push(trait.afterCreate);
      }
    });

    hooks.forEach((hook) => {
      hook(model);
    });

    return model;
  }

  // -- PRIVATE METHODS --

  private processAttributes(
    attrs: FactoryAttrs<TAttrs>,
    modelId?: NonNullable<TAttrs['id']>,
  ): Partial<TAttrs> {
    const keys = this.sortAttrs(attrs, modelId);

    return keys.reduce((acc, key) => {
      const value = attrs[key as Exclude<keyof TAttrs, 'id'>];

      if (typeof value === 'function') {
        acc[key] = value.call(attrs, modelId);
      } else {
        acc[key] = value as TAttrs[keyof TAttrs];
      }

      return acc;
    }, {} as Partial<TAttrs>);
  }

  private buildWithTraits(
    traitNames: string[],
    modelId?: NonNullable<TAttrs['id']>,
  ): Partial<TAttrs> {
    return traitNames.reduce((traitAttributes, name) => {
      const trait = this.traits[name];

      if (trait) {
        const { afterCreate, ...extension } = trait;

        Object.entries(extension).forEach(([key, value]) => {
          traitAttributes[key as keyof TAttrs] =
            typeof value === 'function' ? value.call(this.attributes, modelId) : value;
        });
      }

      return traitAttributes;
    }, {} as Partial<TAttrs>);
  }

  private mergeAttributes(
    baseAttributes: Partial<TAttrs>,
    overrideAttributes: Partial<TAttrs>,
  ): Partial<TAttrs> {
    return {
      ...baseAttributes,
      ...overrideAttributes,
    };
  }

  private mergeAttributesWithId(
    baseAttributes: Partial<TAttrs>,
    overrideAttributes: Partial<TAttrs>,
  ): TAttrs {
    return {
      ...baseAttributes,
      ...overrideAttributes,
    } as TAttrs;
  }

  private sortAttrs(
    attrs: FactoryAttrs<TAttrs>,
    modelId?: NonNullable<TAttrs['id']>,
  ): (keyof TAttrs)[] {
    const visited = new Set<string>();
    const processing = new Set<string>();

    const detectCycle = (key: string): boolean => {
      if (processing.has(key)) {
        throw new MirageError(`Circular dependency detected: ${key}`);
      }
      if (visited.has(key)) {
        return false;
      }

      processing.add(key);
      const value = attrs[key as Exclude<keyof TAttrs, 'id'>];

      if (typeof value === 'function') {
        // Create a proxy to track property access
        const proxy = new Proxy(attrs, {
          get(target, prop) {
            if (typeof prop === 'string' && prop in target) {
              detectCycle(prop);
            }
            return target[prop as keyof typeof target];
          },
        });

        // Call the function with the proxy as this context
        (value as Function).call(proxy, modelId);
      }

      processing.delete(key);
      visited.add(key);
      return false;
    };

    // Check each attribute for cycles
    Object.keys(attrs).forEach(detectCycle);

    // Return keys in their original order
    return Object.keys(attrs) as (keyof TAttrs)[];
  }
}

// -- TYPES --

export type FactoryAttrs<TAttrs extends ModelAttrs<AllowedIdTypes>> = {
  [K in Exclude<keyof TAttrs, 'id'>]:
    | TAttrs[K]
    | ((this: Record<keyof TAttrs, any>, modelId: NonNullable<TAttrs['id']>) => TAttrs[K]);
};

export type TraitDefinition<TAttrs extends ModelAttrs<AllowedIdTypes>> = Partial<
  FactoryAttrs<TAttrs>
> & {
  afterCreate?: (model: ModelInstance<TAttrs>) => void;
};

export type FactoryDefinition<TAttrs extends ModelAttrs<AllowedIdTypes>> = {
  attributes: FactoryAttrs<TAttrs>;
  traits?: Record<string, TraitDefinition<TAttrs>>;
  afterCreate?: (model: ModelInstance<TAttrs>) => void;
};

export type FactoryInstance<TAttrs extends ModelAttrs<AllowedIdTypes>> = BaseFactory<TAttrs>;
