import { pluralize, singularize } from 'inflected';

/**
 * Inflector is a singleton class that provides methods for singularizing and pluralizing words.
 * It uses the inflected library to perform the transformations.
 * @example
 * const inflector = Inflector.instance;
 * const singular = inflector.singularize("books"); // "book"
 * const plural = inflector.pluralize("book"); // "books"
 *
 * // Register a custom inflector
 * inflector.register({
 *   singularize: (word) => word.replace(/s$/, ""),
 *   pluralize: (word) => word + "s"
 * });
 */
export default class Inflector {
  static #instance: Inflector;
  private singularizeFn: (word: string) => string;
  private pluralizeFn: (word: string) => string;

  private constructor() {
    this.singularizeFn = singularize;
    this.pluralizeFn = pluralize;
  }

  /**
   * Returns the singleton instance of the Inflector.
   * @returns The singleton instance of the Inflector.
   */
  static get instance(): Inflector {
    if (!Inflector.#instance) {
      Inflector.#instance = new Inflector();
    }
    return Inflector.#instance;
  }

  /**
   * Registers a custom inflector.
   * @param inflector - The inflector to register.
   * @param inflector.singularize - The function to use for singularizing words.
   * @param inflector.pluralize - The function to use for pluralizing words.
   */
  register(inflector: {
    singularize: (word: string) => string;
    pluralize: (word: string) => string;
  }): void {
    this.singularizeFn = inflector.singularize;
    this.pluralizeFn = inflector.pluralize;
  }

  /**
   * Singularizes a word.
   * @param word - The word to singularize.
   * @returns The singularized word.
   */
  singularize(word: string): string {
    return this.singularizeFn(word);
  }

  /**
   * Pluralizes a word.
   * @param word - The word to pluralize.
   * @returns The pluralized word.
   */
  pluralize(word: string): string {
    return this.pluralizeFn(word);
  }
}
