import type { AllowedIdTypes, DbCollection, DbRecordInput } from '@src/db';
import type { FactoryInstance } from '@src/factory';
import {
  List,
  type ModelAttrs,
  type ModelClass,
  type ModelInstance,
  type SavedModelAttrs,
  type SavedModelInstance,
} from '@src/model';

import { Inflector } from '../inflector';

/**
 * A collection for managing model instances, similar to MirageJS's schema collection API.
 */
export default class SchemaCollection<
  TAttrs extends ModelAttrs<AllowedIdTypes> = ModelAttrs<string>,
> {
  name: string;
  private modelName: string;
  private modelClass: ModelClass<TAttrs>;
  private dbCollection: DbCollection<TAttrs, NonNullable<TAttrs['id']>>;
  private factory: FactoryInstance<TAttrs>;

  constructor(
    collectionName: string,
    modelClass: ModelClass<TAttrs>,
    dbCollection: DbCollection<TAttrs, NonNullable<TAttrs['id']>>,
    factory: FactoryInstance<TAttrs>,
  ) {
    this.name = collectionName;
    this.modelName = Inflector.instance.singularize(collectionName);
    this.modelClass = modelClass;
    this.dbCollection = dbCollection;
    this.factory = factory;
  }

  /**
   * Create a new model for the collection.
   * @param {(string | object)[]} traitsOrDefaults - The traits or default values to use for the model.
   * @returns The new model instance.
   */
  create(...traitsOrDefaults: (string | Partial<TAttrs>)[]): ModelInstance<TAttrs> {
    const attrs = this.factory.build(this.dbCollection.nextId, ...traitsOrDefaults);
    const model = this.new(attrs).save();

    this.factory.processAfterCreateHooks(model, ...traitsOrDefaults);

    return model;
  }

  /**
   * Create a list of models for the collection.
   * @param {number} count - The number of models to create.
   * @param {(string | object)[]} traitsOrDefaults - The traits or default values to use for the models.
   * @returns A list of model instances.
   */
  createList(count: number, ...traitsOrDefaults: (string | Partial<TAttrs>)[]): List<TAttrs> {
    const models = Array.from({ length: count }, () => this.create(...traitsOrDefaults));
    return new List({ modelName: this.modelName, models });
  }

  /**
   * Returns all model instances in the collection.
   * @returns All model instances in the collection.
   */
  all(): SavedModelInstance<TAttrs>[] {
    const records = this.dbCollection.records;
    const models = records.map((record) => this._createModelFromRecord(record));
    return models;
  }

  /**
   * Finds a model by id.
   * @param id - The id of the model to find.
   * @returns The model instance or null if not found.
   */
  find(id: TAttrs['id']): SavedModelInstance<TAttrs> | null {
    if (id == null) return null;
    const record = this.dbCollection.find(id as NonNullable<TAttrs['id']>);
    return record ? this._createModelFromRecord(record) : null;
  }

  /**
   * Finds the first model matching the query.
   * @param query - The query to find the model by.
   * @returns The model instance or null if not found.
   */
  findBy(
    query: DbRecordInput<TAttrs, NonNullable<TAttrs['id']>>,
  ): SavedModelInstance<TAttrs> | null {
    const record = this.dbCollection.findBy(query);
    return record ? this._createModelFromRecord(record) : null;
  }

  /**
   * Finds the first model matching the query or creates a new one.
   * @param query - The query to find the model by.
   * @param traitsOrDefaults - The traits or default values to use when creating a new model.
   * @returns The model instance.
   */
  findOrCreateBy(
    query: DbRecordInput<TAttrs, NonNullable<TAttrs['id']>>,
    ...traitsOrDefaults: (string | Partial<TAttrs>)[]
  ): SavedModelInstance<TAttrs> {
    const existingModel = this.findBy(query);
    if (existingModel) {
      return existingModel;
    }

    const newModel = this.create(...traitsOrDefaults);
    newModel.update(query);

    return newModel as SavedModelInstance<TAttrs>;
  }

  /**
   * Returns the first model in the collection.
   * @returns The first model in the collection or null if the collection is empty.
   */
  first(): SavedModelInstance<TAttrs> | null {
    const records = this.dbCollection.records;
    return records.length > 0 ? this._createModelFromRecord(records[0]) : null;
  }

  /**
   * Returns the last model in the collection.
   * @returns The last model in the collection or null if the collection is empty.
   */
  last(): SavedModelInstance<TAttrs> | null {
    const records = this.dbCollection.records;
    return records.length > 0 ? this._createModelFromRecord(records[records.length - 1]) : null;
  }

  /**
   * Creates a new model instance (not persisted in the database).
   * @param attrs - The attributes to create the model with. All required attributes must be provided.
   * @returns The new model instance.
   */
  new(attrs: TAttrs): ModelInstance<TAttrs> {
    return new this.modelClass({
      attrs: attrs,
      collection: this.dbCollection,
      name: this.modelName,
    });
  }

  /**
   * Removes a model from the collection.
   * @param id - The id of the model to remove.
   */
  remove(id: NonNullable<TAttrs['id']>): void {
    if (id == null) return;
    this.dbCollection.remove(id);
  }

  /**
   * Finds all models matching the query.
   * @param query - The query to find the models by.
   * @returns All models matching the query.
   */
  where(query: DbRecordInput<TAttrs, NonNullable<TAttrs['id']>>): SavedModelInstance<TAttrs>[];
  /**
   * Finds all models matching the query.
   * @param query - The function to filter models by.
   * @returns All models matching the query.
   */
  where(query: (model: SavedModelInstance<TAttrs>) => boolean): SavedModelInstance<TAttrs>[];
  /**
   * Finds all models matching the query.
   * @param query - The query to find the models by.
   * @returns All models matching the query.
   */
  where(
    query:
      | DbRecordInput<TAttrs, NonNullable<TAttrs['id']>>
      | ((model: SavedModelInstance<TAttrs>) => boolean),
  ): SavedModelInstance<TAttrs>[] {
    const records = this.dbCollection.records;

    if (typeof query === 'function') {
      const matchingRecords = records.filter((record) =>
        query(this._createModelFromRecord(record)),
      );
      return matchingRecords.map((record) => this._createModelFromRecord(record));
    } else {
      const matchingRecords = this.dbCollection.where(query);
      return matchingRecords.map((record) => this._createModelFromRecord(record));
    }
  }

  // -- PRIVATE METHODS --

  /**
   * Helper to create a model instance from a database record.
   * @param record - The database record to create the model from (must have ID).
   * @returns The model instance.
   */
  private _createModelFromRecord(
    record: SavedModelAttrs<TAttrs, NonNullable<TAttrs['id']>>,
  ): SavedModelInstance<TAttrs> {
    return new this.modelClass({
      attrs: record as TAttrs,
      collection: this.dbCollection,
      name: this.modelName,
    }) as SavedModelInstance<TAttrs>;
  }
}
