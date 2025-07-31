import {
  DB,
  type AllowedIdTypes,
  type DbCollection,
  type DbRecord,
  type IdentityManager,
} from '@src/db';
import { type FactoryInstance } from '@src/factory';
import { Inflector } from '@src/inflector';
import { Model, type ModelAttrs, type ModelClass } from '@src/model';
import { Registry } from '@src/registry';

import SchemaCollection from './SchemaCollection';

/**
 * Schema class that manages model registration and provides type-safe access to models
 * @template TModels - The type map of collection names to their model attributes
 */
export default class Schema<TModels extends Models> {
  private _collections: Map<string, SchemaCollection<any>> = new Map();
  private _db!: DB<{
    [K in keyof TModels]: DbCollection<TModels[K], NonNullable<TModels[K]['id']>>;
  }>;
  private _registry: Registry;

  constructor(options: SchemaOptions<TModels>) {
    this._registry = new Registry();

    this.registerInflector(options.inflector);
    this.registerModels(options.models);
    this.registerFactories(options.factories);
    this.registerIdentityManagers(options.identityManagers);
    this.initializeDb(options.fixtures);
    this.createCollections();
  }

  /**
   * Create a new Schema instance with collection accessors
   * @param options - The options for the schema
   * @returns The new Schema instance with collection accessors
   */
  static setup<TModels extends Record<string, ModelAttrs<AllowedIdTypes>>>(
    options: SchemaOptions<TModels>,
  ): SchemaInstance<TModels> {
    return new Schema(options) as SchemaInstance<TModels>;
  }

  /**
   * Get the database instance
   * @returns The database instance
   */
  get db(): DB<{
    [K in keyof TModels]: DbCollection<TModels[K], NonNullable<TModels[K]['id']>>;
  }> {
    return this._db;
  }

  /**
   * Get a schema collection by collection name
   * @param collectionName - The name of the collection
   * @returns The schema collection for the collection
   */
  getCollection<K extends keyof TModels>(collectionName: K): SchemaCollection<TModels[K]> {
    const collection = this._collections.get(collectionName as string);
    if (!collection) {
      throw new Error(`Collection '${String(collectionName)}' not found`);
    }

    return collection as unknown as SchemaCollection<TModels[K]>;
  }

  private registerInflector(inflector?: Inflector): void {
    if (inflector) {
      Inflector.instance.register(inflector);
    }
  }

  /**
   * Register user-defined models in the registry
   * @param models - The models to register
   */
  private registerModels(models: SchemaOptions<TModels>['models']): void {
    if (models) {
      Object.entries(models).forEach(([collectionName, modelClass]) => {
        this._registry.models.set(collectionName, modelClass);
      });
    }
  }

  /**
   * Register all factories in the registry and base model classes if they don't exist
   * @param factories - The factories to register
   */
  private registerFactories(factories: SchemaOptions<TModels>['factories']): void {
    Object.entries(factories).forEach(([collectionName, factory]) => {
      if (!this._registry.models.has(collectionName)) {
        this._registry.models.set(collectionName, Model.define<TModels[keyof TModels]>());
      }
      this._registry.factories.set(collectionName, factory);
    });
  }

  /**
   * Register model-specific identity managers in the registry
   * @param identityManagers - The identity managers to register
   */
  private registerIdentityManagers(
    identityManagers: SchemaOptions<TModels>['identityManagers'],
  ): void {
    if (identityManagers) {
      Object.entries(identityManagers).forEach(([collectionName, manager]) => {
        this._registry.identityManagers.set(collectionName, manager);
      });
    }
  }

  /**
   * Initialize the database with fixtures
   * @param fixtures - The initial data for the database
   */
  private initializeDb(fixtures: SchemaOptions<TModels>['fixtures']): void {
    this._db = DB.setup({
      identityManagers: this._registry.identityManagers,
      initialData: fixtures,
    }) as DB<{
      [K in keyof TModels]: DbCollection<TModels[K], NonNullable<TModels[K]['id']>>;
    }>;
  }

  /**
   * Create schema collections for all registered models
   */
  private createCollections(): void {
    for (const [collectionName, modelClass] of this._registry.models.entries()) {
      let dbCollection: DbCollection<any, any>;
      if (this._db.hasCollection(collectionName)) {
        dbCollection = this._db.getCollection(collectionName);
      } else {
        this._db.createCollection(collectionName);
        dbCollection = this._db.getCollection(collectionName);
      }

      const factory = this._registry.factories.get(collectionName);
      const collection = new SchemaCollection(collectionName, modelClass, dbCollection, factory);

      this._collections.set(collectionName, collection);

      if (!Object.prototype.hasOwnProperty.call(this, collectionName)) {
        Object.defineProperty(this, collectionName, {
          get: () => {
            return this._collections.get(collectionName);
          },
          enumerable: true,
          configurable: true,
        });
      }
    }
  }
}

// -- TYPES --

/**
 * Type for models where keys are plural collection names and values are model attributes
 */
export type Models = Record<string, ModelAttrs<AllowedIdTypes>>;

/**
 * Extracts collection names that have string IDs
 */
type CollectionsWithStringIds<TModels extends Models> = {
  [K in keyof TModels]: TModels[K]['id'] extends string ? K : never;
}[keyof TModels];

/**
 * Extracts collection names that have number IDs
 */
type CollectionsWithNumberIds<TModels extends Models> = {
  [K in keyof TModels]: TModels[K]['id'] extends number ? K : never;
}[keyof TModels];

/**
 * Base options for creating a Schema instance
 * @template TModels - The type map of collection names to their model attributes
 */
type SchemaBaseOptions<TModels extends Models> = {
  factories: Record<keyof TModels, FactoryInstance<any>>;
  fixtures?: Record<keyof TModels, DbRecord<any, AllowedIdTypes>[]>;
  inflector?: Inflector;
  models?: Record<string, ModelClass<any>>;
};

/**
 * Options for creating a Schema instance
 * @template TModels - The type map of collection names to their model attributes
 */
export type SchemaOptions<TModels extends Models> =
  CollectionsWithNumberIds<TModels> extends never
    ? SchemaBaseOptions<TModels> & {
        // String IDs found - identityManagers is required with required string ID managers
        identityManagers: {
          application?: IdentityManager<string>;
        } & Record<CollectionsWithStringIds<TModels>, IdentityManager<string>> &
          Partial<Record<CollectionsWithNumberIds<TModels>, IdentityManager<number>>>;
      }
    : SchemaBaseOptions<TModels> & {
        // No string IDs found - identityManagers is optional with optional collection properties
        identityManagers?: {
          application?: IdentityManager<number>;
        } & Partial<Record<CollectionsWithNumberIds<TModels>, IdentityManager<number>>>;
      };

/**
 * Instance of Schema class with accessors for the collections
 * @template TModels - The type map of collection names to their model attributes
 */
export type SchemaInstance<TModels extends Models> = Schema<TModels> & {
  [K in keyof TModels]: SchemaCollection<TModels[K]>;
};
