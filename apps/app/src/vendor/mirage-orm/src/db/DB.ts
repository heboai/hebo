import { MirageError } from '@src/utils';

import DbCollection, { type DbRecord, type DbRecordInput } from './DbCollection';
import IdentityManager, { type AllowedIdTypes } from './IdentityManager';

/**
 * A database for storing and managing collections of records.
 * @template TCollections - The type of collections in the database
 * @example
 * const db = DB.create({
 *   users: [{ id: "1", name: 'John' }],
 *   posts: [{ id: "1", title: 'Hello' }]
 * });
 * db.users.records;
 */
export default class DB<TCollections extends Record<string, DbCollection<any, any>>> {
  private _collections: Map<keyof TCollections, DbCollection<any, any>> = new Map();
  private _identityManagers: Map<string, IdentityManager<any>> = new Map();

  constructor(options: DbOptions<TCollections> = {}) {
    const { identityManagers, initialData } = options;

    this._identityManagers = identityManagers ?? new Map();
    if (!this._identityManagers.has('application')) {
      this._identityManagers.set('application', new IdentityManager<string>());
    }

    if (initialData) {
      this.loadData(initialData);
    }

    this.initCollectionAccessors();
  }

  /**
   * Factory method for creating a DB instance with collection accessors
   * @template TCollections - The type of collections in the database
   * @param options - The options for the database
   * @param options.identityManagers - The identity managers to use for the database
   * @param options.initialData - The initial data to populate collections
   * @returns A DB instance with typed collection accessors
   * @example
   * const db = DB.setup({
   *   users: [{ id: "1", name: 'John' }],
   *   posts: [{ id: "1", title: 'Hello world' }]
   * });
   *
   * db.users.records; // [{ id: "1", name: 'John' }]
   * db.posts.records; // [{ id: "1", title: 'Hello world' }]
   */
  static setup<TCollections extends Record<string, DbCollection<any, any>>>(
    options?: DbOptions<TCollections>,
  ): DbInstance<TCollections> {
    return new DB<TCollections>(options) as DbInstance<TCollections>;
  }

  // -- COLLECTION MANAGEMENT --

  /**
   * Checks if a collection exists.
   * @param name - The name of the collection to check.
   * @returns `true` if the collection exists, `false` otherwise.
   */
  hasCollection(name: keyof TCollections): boolean {
    return this._collections.has(name);
  }

  /**
   * Creates a new collection with the given name and initial data.
   * @param name - The name of the collection to create.
   * @param initialData - The initial data to populate the collection with.
   * @returns The DB instance.
   */
  createCollection<TAttrs extends object, TId extends AllowedIdTypes, TName extends string>(
    name: TName,
    initialData?: DbRecordInput<TAttrs, TId>[],
  ): DbInstance<TCollections & { [K in TName]: DbCollection<TAttrs, TId> }> {
    if (this._collections.has(name as keyof TCollections)) {
      throw new Error(`Collection ${name} already exists`);
    }

    const identityManager = this.identityManagerFor(
      name as keyof TCollections,
    ) as IdentityManager<TId>;
    const collection = new DbCollection<TAttrs, TId>({
      identityManager,
      initialData,
      name,
    } as any);

    this._collections.set(name as keyof TCollections, collection);
    this.initCollectionAccessors();

    return this as unknown as DbInstance<
      TCollections & { [K in TName]: DbCollection<TAttrs, TId> }
    >;
  }

  /**
   * Retrieves a collection by its name.
   * @template T - The collection key
   * @param name - The name of the collection to retrieve.
   * @returns The collection with the specified name.
   * @throws {Error} If the collection does not exist.
   */
  getCollection<T extends keyof TCollections>(name: T): TCollections[T] {
    const collection = this._collections.get(name);

    if (!collection) {
      throw new MirageError(`Collection ${String(name)} does not exist`);
    }

    return collection as TCollections[T];
  }

  // -- DATA MANAGEMENT --

  /**
   * Dumps the data from all collections in the database.
   * @returns A record of collection names and their data.
   */
  dump(): DbData<TCollections> {
    const data = {} as DbData<TCollections>;

    this._collections.forEach((collection, name) => {
      data[name] = collection.records as DbCollectionData<TCollections[typeof name]>;
    });

    return data;
  }

  /**
   * Empties the data from all collections in the database.
   */
  emptyData(): void {
    this._collections.forEach((collection) => collection.clear());
  }

  /**
   * Loads collections data from a record into the database.
   * @template TData - The type of data to load
   * @param data - Record of collection names and their initial data
   * @returns The DB instance with collection accessors for the loaded data.
   */
  loadData<TData extends Record<string, any[]>>(
    data: TData,
  ): DbInstance<TCollections & InferCollectionsFromData<TData>> {
    (Object.entries(data) as [keyof TData, TData[keyof TData]][]).forEach(([name, records]) => {
      if (this.hasCollection(name as keyof TCollections)) {
        this.getCollection(name as keyof TCollections).insertMany(records);
      } else {
        this.createCollection(name as string, records);
      }
    });

    return this as unknown as DbInstance<TCollections & InferCollectionsFromData<TData>>;
  }

  // -- IDENTITY MANAGEMENT --

  /**
   * Retrieves the identity manager for a given collection name.
   * @param collectionName - The name of the collection to get the identity manager for.
   * @returns The identity manager for the given collection name or the application identity manager if no specific manager is found.
   */
  identityManagerFor(collectionName: keyof TCollections): IdentityManager<any> {
    const name = collectionName as string;
    if (!this._identityManagers.has(name)) {
      return this._identityManagers.get('application')!;
    }
    return this._identityManagers.get(name)!;
  }

  // -- PRIVATE METHODS --

  private initCollectionAccessors(): void {
    this._collections.forEach((collection, name) => {
      if (!Object.prototype.hasOwnProperty.call(this, name)) {
        Object.defineProperty(this, name, {
          get: () => collection,
          enumerable: true,
          configurable: true,
        });
      }
    });
  }
}

// -- TYPES --

/**
 * Infers the collection type from data records
 * @template TData - The type of data records
 */
type InferCollectionFromData<TData> =
  TData extends Array<infer TRecord>
    ? TRecord extends { id: infer TId }
      ? TId extends AllowedIdTypes
        ? DbCollection<Omit<TRecord, 'id'>, TId>
        : DbCollection<Omit<TRecord, 'id'>, string>
      : TRecord extends Record<string, unknown>
        ? DbCollection<TRecord, string>
        : DbCollection<Record<string, unknown>, string>
    : DbCollection<Record<string, unknown>, string>;

/**
 * Infers collections map from data object
 * @template TData - The type of data object
 */
type InferCollectionsFromData<TData> = {
  [K in keyof TData]: InferCollectionFromData<TData[K]>;
};

/**
 * Gets the attributes and ID of a collection
 * @template T - The type of the collection
 */
type DbCollectionAttrs<T> =
  T extends DbCollection<infer TAttrs, infer TId>
    ? {
        id: TId;
        attrs: TAttrs;
      }
    : never;

/**
 * Gets the data of a collection
 * @template T - The type of the collection
 */
type DbCollectionData<T> = DbRecord<DbCollectionAttrs<T>['attrs'], DbCollectionAttrs<T>['id']>[];

/**
 * Type for a database's data
 * @template TCollections - The type of collections in the database
 */
export type DbData<TCollections extends Record<string, DbCollection<any, any>>> = {
  [K in keyof TCollections]: DbCollectionData<TCollections[K]>;
};

/**
 * Options for creating a DB instance
 * @template TCollections - The type of collections in the database
 */
export type DbOptions<TCollections extends Record<string, DbCollection<any, any>>> = {
  identityManagers?: Map<string, IdentityManager<any>>;
  initialData?: DbData<TCollections>;
};

/**
 * Type for a DB instance with collection accessors
 * @template TCollections - The type of collections in the database
 */
export type DbInstance<TCollections extends Record<string, DbCollection<any, any>>> =
  DB<TCollections> & {
    [K in keyof TCollections]: TCollections[K];
  };
