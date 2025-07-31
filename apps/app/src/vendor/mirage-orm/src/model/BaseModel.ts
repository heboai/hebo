import { DbCollection, DbRecordInput, type AllowedIdTypes } from '@src/db';
import { Inflector } from '@src/inflector';
import { camelize } from '@src/utils/string';

/**
 * Base model class that handles core functionality
 * @template TAttrs - The type of the model's attributes
 */
export default class BaseModel<TAttrs extends ModelAttrs<AllowedIdTypes> = ModelAttrs<string>> {
  readonly modelName: string;
  protected _attrs: TAttrs;
  protected _collection: DbCollection<TAttrs, NonNullable<TAttrs['id']>>;
  protected _status: 'new' | 'saved';

  constructor({ attrs, collection, name }: ModelOptions<TAttrs>) {
    this.modelName = Inflector.instance.singularize(camelize(name, false));

    this._attrs = { ...attrs, id: attrs?.id ?? null } as TAttrs;
    this._collection = collection;
    this._status = this._attrs.id ? this._verifyStatus(this._attrs.id) : 'new';

    this.initAttributeAccessors();
  }

  /**
   * Creates a new model class with attribute accessors
   * @template TAttrs - The type of the model's attributes
   * @returns A model class that can be instantiated with 'new'
   */
  static create<
    TAttrs extends ModelAttrs<AllowedIdTypes> = ModelAttrs<string>,
  >(): ModelClass<TAttrs> {
    return class extends BaseModel<TAttrs> {
      constructor(options: ModelOptions<TAttrs>) {
        super(options);
      }
    } as unknown as ModelClass<TAttrs>;
  }

  // -- GETTERS --

  /**
   * Getter for the protected id attribute
   * @returns The id of the model
   */
  get id(): TAttrs['id'] {
    return this._attrs.id;
  }

  /**
   * Getter for the model attributes
   * @returns A copy of the model attributes
   */
  get attrs(): TAttrs {
    return { ...this._attrs };
  }

  // -- MAIN METHODS --

  /**
   * Destroy the model from the database
   * @returns The model with new instance type
   */
  destroy(): ModelInstance<TAttrs> {
    if (this.isSaved() && this.id) {
      this._collection.remove(this.id as NonNullable<TAttrs['id']>);
      this._attrs = { ...this._attrs, id: null } as TAttrs;
      this._status = 'new';
    }

    return this as unknown as ModelInstance<TAttrs>;
  }

  /**
   * Reload the model from the database
   * @returns The model with saved instance type
   */
  reload(): SavedModelInstance<TAttrs> {
    if (this.isSaved() && this.id) {
      this._attrs = this._collection.find(this.id as NonNullable<TAttrs['id']>) as TAttrs;
    }

    return this as unknown as SavedModelInstance<TAttrs>;
  }

  /**
   * Save the model to the database
   * @returns The model with saved instance type
   */
  save(): SavedModelInstance<TAttrs> {
    if (this.isNew() || !this.id) {
      const modelRecord = this._collection.insert(
        this._attrs as DbRecordInput<TAttrs, NonNullable<TAttrs['id']>>,
      );
      this._attrs = modelRecord;
      this._status = 'saved';
    } else {
      this._collection.update(
        this.id as NonNullable<TAttrs['id']>,
        this._attrs as DbRecordInput<TAttrs, NonNullable<TAttrs['id']>>,
      );
    }

    return this as unknown as SavedModelInstance<TAttrs>;
  }

  /**
   * Update the model attributes and save the model
   * @param attrs - The attributes to update
   * @returns The model with saved instance type
   */
  update(attrs: Partial<TAttrs>): SavedModelInstance<TAttrs> {
    Object.assign(this._attrs, attrs);
    return this.save();
  }

  // -- STATUS --

  /**
   * Check if the model is new
   * @returns True if the model is new, false otherwise
   */
  isNew(): boolean {
    return this._status === 'new';
  }

  /**
   * Check if the model is saved
   * @returns True if the model is saved, false otherwise
   */
  isSaved(): boolean {
    return this._status === 'saved';
  }

  // -- SERIALIZATION --

  /**
   * Serialize the model to a JSON object
   * @returns The copy of the model attributes as a JSON object
   */
  toJSON(): TAttrs {
    return { ...this._attrs };
  }

  /**
   * Serialize the model to a string
   * @returns The simple string representation of the model and its id
   */
  toString(): string {
    let idLabel = this.id ? `(${this.id})` : '';
    return `model:${this.modelName}${idLabel}`;
  }

  // -- ATTRIBUTE ACCESSORS --

  /**
   * Initialize attribute accessors for all attributes except id
   */
  protected initAttributeAccessors(): void {
    // Remove old accessors
    for (const key in this._attrs) {
      if (key !== 'id' && Object.prototype.hasOwnProperty.call(this, key)) {
        delete this[key as keyof this];
      }
    }

    // Set up new accessors
    for (const key in this._attrs) {
      if (key !== 'id' && !Object.prototype.hasOwnProperty.call(this, key)) {
        Object.defineProperty(this, key, {
          get: () => {
            return this._attrs[key];
          },
          set: (value: TAttrs[keyof TAttrs]) => {
            this._attrs[key as keyof TAttrs] = value;
          },
          enumerable: true,
          configurable: true,
        });
      }
    }
  }

  // -- PRIVATE METHODS --

  /**
   * Verify the status of the model during initialization when the id is provided
   * @param id - The id of the model
   * @returns The status of the model
   */
  private _verifyStatus(id: NonNullable<TAttrs['id']>): 'new' | 'saved' {
    return this._collection.find(id as NonNullable<TAttrs['id']>) ? 'saved' : 'new';
  }
}

// -- TYPES --

/**
 * Type for model attributes
 * @template TId - The type of the model's id (defaults to string)
 * @param attrs.id - The id of the model (optional for new models, required for saved models)
 */
export type ModelAttrs<TId = string> = {
  id?: TId | null;
  [key: string]: any;
};

/**
 * Type for saved model attributes (with required ID)
 * @template TAttrs - The base attributes type
 * @template TId - The ID type
 */
export type SavedModelAttrs<TAttrs, TId extends AllowedIdTypes> = Omit<TAttrs, 'id'> & { id: TId };

/**
 * Options for creating a model
 * @template TAttrs - The type of the model's attributes
 * @param options.attrs - The attributes for the model
 * @param options.collection - The collection to use for the model
 * @param options.name - The name of the model
 */
export interface ModelOptions<TAttrs extends ModelAttrs<AllowedIdTypes>> {
  attrs?: TAttrs;
  collection: DbCollection<TAttrs, NonNullable<TAttrs['id']>>;
  name: string;
}

/**
 * Type for model instance with accessors for the attributes
 * @template TAttrs - The type of the model's attributes
 */
export type ModelInstance<TAttrs extends ModelAttrs<AllowedIdTypes>> = BaseModel<TAttrs> & {
  [K in keyof TAttrs]: TAttrs[K];
};

/**
 * Type for saved model instance (with required ID)
 * @template TAttrs - The base attributes type
 */
export type SavedModelInstance<TAttrs extends ModelAttrs<AllowedIdTypes>> = ModelInstance<
  TAttrs & { id: NonNullable<TAttrs['id']> }
>;

/**
 * Type for model class with attribute accessors
 * @template TAttrs - The type of the model's attributes
 */
export type ModelClass<TAttrs extends ModelAttrs<AllowedIdTypes>> = {
  new (options: ModelOptions<TAttrs>): ModelInstance<TAttrs>;
};
