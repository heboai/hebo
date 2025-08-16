import { MirageError } from '../utils';

/**
 * Manages unique identifiers for database records.
 * Handles different types of IDs, ensuring uniqueness and proper sequencing.
 * @template T - The type of ID to manage (defaults to string)
 * @param options - Configuration options for the identity manager.
 * @param options.initialCounter - The initial counter value.
 * @param options.initialUsedIds - A set of initial used IDs.
 * @param options.idGenerator - Custom function to generate the next ID.
 * @example
 * const identityManager = new IdentityManager();
 * identityManager.get(); // => "1"
 * identityManager.set("1");
 * identityManager.get(); // => "2"
 * identityManager.fetch(); // => "2"
 * identityManager.get(); // => "3"
 * identityManager.reset(); // => "1"
 */
export default class IdentityManager<T extends AllowedIdTypes = string> {
  private _counter: T;
  private _idGenerator: IdGenerator<T>;
  private _initialCounter: T;
  private _usedIds: Set<T>;

  constructor(options: IdentityManagerOptions<T> = {}) {
    this._initialCounter = options.initialCounter ?? ('1' as T);
    this._counter = this._initialCounter;
    this._usedIds = options.initialUsedIds ? new Set<T>(options.initialUsedIds) : new Set<T>();
    this._idGenerator = options.idGenerator ?? this.getDefaultGenerator();
  }

  /**
   * Gets the next available ID.
   * @returns The next available ID
   * @example
   * const identityManager = new IdentityManager();
   * identityManager.get(); // => "1"
   */
  get(): T {
    let nextId = this._counter;

    while (this._usedIds.has(nextId)) {
      nextId = this._idGenerator(nextId);
    }

    return nextId;
  }

  /**
   * Marks an ID as used and updates the counter.
   * @param id - The ID to mark as used
   * @throws Error if the ID is already in use
   * @example
   * const identityManager = new IdentityManager();
   * identityManager.set("2"); // => "2"
   */
  set(id: T): void {
    if (!this._usedIds.has(id)) {
      this._usedIds.add(id);
    }
  }

  /**
   * Fetches the next available ID and marks it as used.
   * @returns The next available ID
   * @example
   * const identityManager = new IdentityManager();
   * identityManager.fetch(); // => "1"
   */
  fetch(): T {
    const id = this.get();

    this.set(id);
    this._counter = this._idGenerator(id);

    return id;
  }

  /**
   * Resets the manager's state, clearing all used IDs and resetting the counter.
   */
  reset(): void {
    this._counter = this._initialCounter;
    this._usedIds.clear();
  }

  // -- Private methods -- //

  /**
   * Returns the default ID generator for string IDs
   * @returns The default ID generator
   * @throws Error if used with non-string types
   * @example
   * const identityManager = new IdentityManager();
   * identityManager.getDefaultGenerator(); // => (currentId) => String(Number(currentId) + 1)
   */
  private getDefaultGenerator(): IdGenerator<T> {
    return (currentId: T) => {
      if (typeof currentId === 'string') {
        const numId = Number(currentId);

        if (isNaN(numId)) {
          throw new MirageError(
            'Default ID generator only works with numeric string IDs. Provide a custom idGenerator for other types.',
          );
        }

        return String(numId + 1) as T;
      }
      if (typeof currentId === 'number') {
        return ((currentId as number) + 1) as T;
      }
      throw new MirageError(
        'Default ID generator only works with strings and numbers. Provide a custom idGenerator for other types.',
      );
    };
  }
}

// -- Types -- //

/**
 * Type for allowed ID types
 */
export type AllowedIdTypes = number | string;

/**
 * Type for ID generator function that takes current ID and returns next ID
 * @template T - The type of ID
 * @param currentId - The current ID
 * @returns The next ID
 */
export type IdGenerator<T> = (currentId: T) => T;

/**
 * Configuration options for the IdentityManager
 * @template T - The type of ID
 * @param initialCounter - The initial counter value
 * @param initialUsedIds - A set of initial used IDs
 * @param idGenerator - Custom function to generate the next ID
 */
export interface IdentityManagerOptions<T = string> {
  initialCounter?: T;
  initialUsedIds?: T[];
  idGenerator?: IdGenerator<T>;
}
