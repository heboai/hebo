import { type AllowedIdTypes } from '@src/db';

import type { ModelInstance, ModelAttrs } from './BaseModel';

/**
 * A list of models that extends native Array
 * @template TAttrs - The type of the model's attributes
 * @param options - The options for the list
 * @param options.modelName - The name of the model
 * @param options.models - The initial models in the list
 */
export default class List<TAttrs extends ModelAttrs<AllowedIdTypes>> extends Array<
  ModelInstance<TAttrs>
> {
  public readonly modelName: string;

  constructor(options: ListOptions<TAttrs>) {
    super(...(options.models ?? []));
    this.modelName = options.modelName;
  }

  // -- ARRAY METHODS OVERRIDES (to preserve modelName) --

  /**
   * Filter the list
   * @param predicate - The predicate to filter the list
   * @returns The filtered list
   */
  filter(
    predicate: (
      value: ModelInstance<TAttrs>,
      index: number,
      array: ModelInstance<TAttrs>[],
    ) => boolean,
  ): ModelInstance<TAttrs>[] {
    return new List<TAttrs>({
      modelName: this.modelName,
      models: super.filter(predicate),
    });
  }

  /**
   * Slice the list
   * @param start - The start index
   * @param end - The end index
   * @returns The sliced list
   */
  slice(start?: number, end?: number): ModelInstance<TAttrs>[] {
    return new List<TAttrs>({
      modelName: this.modelName,
      models: super.slice(start, end),
    });
  }

  /**
   * Concatenate the list
   * @param items - The items to concatenate
   * @returns The concatenated list
   */
  concat(
    ...items: (ModelInstance<TAttrs> | ConcatArray<ModelInstance<TAttrs>>)[]
  ): ModelInstance<TAttrs>[] {
    const models = items.flatMap((item) =>
      item instanceof List ? Array.from(item) : Array.isArray(item) ? item : [item],
    );
    return new List<TAttrs>({
      modelName: this.modelName,
      models: super.concat(...models),
    });
  }

  /**
   * Get a string representation of the list
   * @returns The string representation
   */
  toString(): string {
    return `list:${this.modelName}(${this.map((m) => m.toString()).join(',')})`;
  }

  // -- LIST-SPECIFIC METHODS --

  /**
   * Add a model to the list and save it in the db
   * @param model - The model to add
   * @returns The list
   */
  add(model: ModelInstance<TAttrs>): this {
    this.push(model.save());
    return this;
  }

  /**
   * Destroy all models in the list
   * @returns The list
   */
  destroy(): this {
    this.forEach((model) => model.destroy());
    this.length = 0;
    return this;
  }

  /**
   * Reload all models in the list
   * @returns The list
   */
  reload(): this {
    this.forEach((model, index) => {
      this[index] = model.reload();
    });
    return this;
  }

  /**
   * Remove a model from the list
   * @param model - The model to remove
   * @returns The list
   */
  remove(model: ModelInstance<TAttrs>): this {
    const index = this.findIndex((m) => m.toString() === model.toString());
    if (index !== -1) {
      this.splice(index, 1);
    }
    return this;
  }

  /**
   * Save all models in the list
   * @returns The list
   */
  save(): this {
    this.forEach((model, index) => {
      this[index] = model.save();
    });
    return this;
  }

  /**
   * Update all models in the list with the given attributes
   * @param attrs - The attributes to update
   * @returns The list
   */
  update(attrs: Partial<TAttrs>): this {
    this.forEach((model, index) => {
      this[index] = model.update(attrs);
    });
    return this;
  }
}

// -- TYPES --

/**
 * Options for the list
 * @template TAttrs - The type of the model's attributes
 * @param options.modelName - The name of the model
 * @param options.models - The initial models in the list
 */
export interface ListOptions<TAttrs extends ModelAttrs<AllowedIdTypes>> {
  modelName: string;
  models?: Array<ModelInstance<TAttrs>>;
}
