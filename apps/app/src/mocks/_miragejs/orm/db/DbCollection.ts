import IdentityManager, { type AllowedIdTypes } from './IdentityManager';

/**
 * A collection of records in a database. Think of it as a table in a relational database.
 * @param options - Options for the collection.
 * @param options.name - The name of the collection.
 * @param options.identityManager - The identity manager for the collection.
 * @param options.initialData - Initial data for the collection.
 * @example
 * const users = new DbCollection({ name: 'users' });
 * users.insert({ name: 'John' }); // => { id: "1", name: 'John' }
 */
export default class DbCollection<
  TAttrs extends object = Record<string, unknown>,
  TId extends AllowedIdTypes = string,
> {
  name: string;
  private _records: Map<TId, DbRecord<TAttrs, TId>> = new Map();
  private _identityManager: IdentityManager<TId>;

  constructor(
    options: TId extends string
      ? DbCollectionOptions<TAttrs>
      : DbCollectionOptionsWithNumberId<TAttrs>,
  ) {
    this.name = options.name;
    this._identityManager = (options as any).identityManager || new IdentityManager<TId>();

    if (options.initialData) {
      this.insertMany(options.initialData as any);
    }
  }

  // -- Getters --

  /**
   * Returns the next available ID for the collection.
   * @returns The next available ID for the collection
   */
  get nextId() {
    return this._identityManager.fetch();
  }

  /**
   * Returns all records in the collection.
   * @returns Array of all records
   */
  get records(): DbRecord<TAttrs, TId>[] {
    return Array.from(this._records.values());
  }

  /**
   * Returns the number of records in the collection.
   * @returns The number of records in the collection
   */
  get size() {
    return this._records.size;
  }

  // -- Query Methods --

  /**
   * Finds the first record in the collection.
   * @returns The first record in the collection or null if the collection is empty.
   */
  first(): DbRecord<TAttrs, TId> | null {
    return this.records[0] || null;
  }

  /**
   * Finds records by their IDs.
   * @param ids - One or more record IDs to find
   * @returns The found record(s) or null if not found
   * @example
   * const users = new DbCollection({ name: 'users' });
   * users.find(1); // => { id: 1, name: 'John' }
   * users.find(1, 2, 3); // => [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }]
   */
  find(id: TId): DbRecord<TAttrs, TId> | null;
  /**
   * Finds records by their IDs.
   * @param ids - One or more record IDs to find
   * @returns The found record(s) or null if not found
   * @example
   * const users = new DbCollection({ name: 'users' });
   * users.find(1, 2, 3); // => [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }]
   */
  find(...ids: TId[]): DbRecord<TAttrs, TId>[];
  /**
   * Finds records by their IDs.
   * @param {...TId} ids - One or more record IDs to find
   * @returns The found record(s) or null if not found
   * @example
   * const users = new DbCollection({ name: 'users' });
   * users.find(1, 2, 3); // => [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }]
   */
  find(...ids: TId[]): DbRecord<TAttrs, TId> | DbRecord<TAttrs, TId>[] | null {
    const records = ids.map((id) => this._records.get(id)).filter(Boolean) as DbRecord<
      TAttrs,
      TId
    >[];

    if (ids.length === 1) {
      return records[0] || null;
    }
    return records;
  }

  /**
   * Finds the first record matching the query.
   * @param query - Query attributes to match the record
   * @returns The first matching record or null
   * @example
   * const users = new DbCollection({ name: 'users' });
   * users.findBy({ name: 'John' }); // => { id: 1, name: 'John' }
   * users.findBy({ name: 'John', age: 30 }); // => null
   */
  findBy(query: DbRecordInput<TAttrs, TId>): DbRecord<TAttrs, TId> | null {
    return this.records.find((record) => this._matchesQuery(record, query)) || null;
  }

  /**
   * Finds records matching the given query.
   * @param query - Either an object with model attributes to match or a predicate function
   * @returns Array of matching records
   * @example
   * const users = new DbCollection({ name: 'users' });
   * users.where({ name: 'John' }); // => [{ id: 1, name: 'John' }]
   * users.where((record) => record.name === 'John' || record.name === 'Jane'); // => [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }]
   */
  where(query: DbQuery<TAttrs, TId>): DbRecord<TAttrs, TId>[] {
    return this.records.filter((record) => {
      if (typeof query === 'function') {
        return query(record);
      }
      return this._matchesQuery(record, query);
    });
  }

  // -- Mutation Methods --

  /**
   * Clears the collection.
   */
  clear(): void {
    this._records.clear();
  }

  /**
   * Inserts a single record into the collection.
   * @param data - The record to insert. All attributes must be provided, but id is optional and will be generated if not provided.
   * @returns The inserted record.
   * @example
   * const users = new DbCollection({ name: 'users' });
   * users.insert({ name: 'John' }); // => { id: 1, name: 'John' }
   */
  insert(data: DbRecordInput<TAttrs, TId>): DbRecord<TAttrs, TId> {
    const record = this._prepareRecord(data);
    this._records.set(record.id, record);
    return record;
  }

  /**
   * Inserts multiple records into the collection in a single operation.
   * @param data - Array of records to insert. All attributes must be provided, but id is optional and will be generated if not provided.
   * @returns Array of inserted records.
   * @example
   * const users = new DbCollection({ name: 'users' });
   * users.insertMany([{ name: 'John' }, { name: 'Jane' }]); // => [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }]
   */
  insertMany(data: DbRecordInput<TAttrs, TId>[]): DbRecord<TAttrs, TId>[] {
    const records = data.map((record) => this._prepareRecord(record));
    records.forEach((record) => this._records.set(record.id, record));
    return records;
  }

  /**
   * Removes records from the collection.
   * If an ID is provided, removes that specific record.
   * If a query is provided, removes all records matching the query.
   * @param idOrQuery - Either the ID of the record to remove or query attributes to match
   * @returns Array of remaining records in the collection
   * @example
   * const users = new DbCollection({ name: 'users' });
   * users.remove(1); // => [{ id: 2, name: 'Jane' }]
   * users.remove({ name: 'John' }); // => [{ id: 2, name: 'Jane' }]
   */
  remove(idOrQuery: DbUpdateInput<TAttrs, TId>): DbRecord<TAttrs, TId>[] {
    // Case 1: ID is passed - remove specific record
    if (typeof idOrQuery !== 'object' || idOrQuery === null) {
      this._records.delete(idOrQuery as TId);
      return this.records;
    }

    // Case 2: Query attributes are passed - remove all matching records
    const matchingRecords = this.where(idOrQuery);
    matchingRecords.forEach((record) => {
      this._records.delete(record.id);
    });

    return this.records;
  }

  /**
   * Updates records in the collection.
   * @param idOrQuery - Either the ID of the record to update, or data object that may include an ID or query
   * @param attrs - The attributes to update the record(s) with
   * @returns The updated record(s) or null if not found
   * @example
   * const users = new DbCollection({ name: 'users' });
   * users.update({ name: 'John' }); // => [{ id: 1, name: 'John' }, { id: 2, name: 'John' }]
   * users.update(1, { name: 'John' }); // => { id: 1, name: 'John' }
   * users.update({ name: 'John' }, { age: 30 }); // => [{ id: 1, name: 'John', age: 30 }]
   */
  update(
    idOrQuery: DbUpdateInput<TAttrs, TId>,
    attrs?: DbRecordInput<TAttrs, TId>,
  ): DbRecord<TAttrs, TId> | DbRecord<TAttrs, TId>[] | null {
    // Case 1: Only attrs are passed - update all records
    if (!attrs) {
      if (typeof idOrQuery !== 'object' || idOrQuery === null) {
        throw new Error('The first argument must be an object if no attrs are provided');
      }

      if (this._records.size === 0) return [];

      const updatedRecords = this.records;
      updatedRecords.forEach((record) => Object.assign(record, idOrQuery));
      return updatedRecords;
    }

    // Case 2: ID and attrs are passed - update specific record by ID
    if (typeof idOrQuery !== 'object' || idOrQuery === null) {
      const record = this._records.get(idOrQuery as TId);
      if (!record) return null;

      Object.assign(record, attrs);
      return record;
    }

    // Case 3: Query and attrs are passed - update first matching record
    const record = this.findBy(idOrQuery);
    if (!record) return null;

    Object.assign(record, attrs);
    return record;
  }

  // -- Utility Private Methods --

  /**
   * Checks if a record matches a query.
   * @param record - The record to check.
   * @param query - The query to match against.
   * @returns true if the record matches the query, false otherwise.
   */
  private _matchesQuery(record: DbRecord<TAttrs, TId>, query: DbRecordInput<TAttrs, TId>): boolean {
    return Object.entries(query).every(
      ([key, value]) => String(record[key as keyof DbRecord<TAttrs, TId>]) === String(value),
    );
  }

  /**
   * Prepares a record for insertion by generating an ID if it doesn't exist.
   * @param data - The record to prepare.
   * @returns The prepared record.
   */
  private _prepareRecord(data: DbRecordInput<TAttrs, TId>): DbRecord<TAttrs, TId> {
    const record = { ...data } as DbRecord<TAttrs, TId>;
    if (!record.id) {
      record.id = this._identityManager.fetch();
    } else {
      this._identityManager.set(record.id);
    }
    return record;
  }
}

// -- Types --

/**
 * Type for a database record
 * @template TAttrs - The type of the record's attributes
 * @template TId - The type of the record's ID
 */
export type DbRecord<TAttrs, TId extends AllowedIdTypes> = TAttrs & { id: TId };

/**
 * Type for input data when creating or updating a record
 * @template TAttrs - The type of the record's attributes
 * @template TId - The type of the record's ID
 */
export type DbRecordInput<TAttrs, TId extends AllowedIdTypes> = Partial<DbRecord<TAttrs, TId>>;

/**
 * Type for query conditions that can be used to find records
 * @template TAttrs - The type of the record's attributes
 * @template TId - The type of the record's ID
 */
export type DbQuery<TAttrs, TId extends AllowedIdTypes> =
  | DbRecordInput<TAttrs, TId>
  | ((record: DbRecord<TAttrs, TId>) => boolean);

/**
 * Type for update operations
 * @template TAttrs - The type of the record's attributes
 * @template TId - The type of the record's ID
 */
export type DbUpdateInput<TAttrs, TId extends AllowedIdTypes> = TId | DbRecordInput<TAttrs, TId>;

/**
 * Options for creating a database collection with string IDs
 * @template TAttrs - The type of the record's attributes
 */
export interface DbCollectionOptions<TAttrs> {
  identityManager?: IdentityManager<string>;
  initialData?: DbRecordInput<TAttrs, string>[];
  name: string;
}

/**
 * Options for creating a database collection with number IDs
 * @template TAttrs - The type of the record's attributes
 */
export interface DbCollectionOptionsWithNumberId<TAttrs> {
  identityManager: IdentityManager<number>;
  initialData?: DbRecordInput<TAttrs, number>[];
  name: string;
}
