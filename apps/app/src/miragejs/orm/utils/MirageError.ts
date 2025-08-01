/**
 * A custom error class for MirageJS.
 * @augments Error
 * @param message - The error message.
 * @example
 * const error = new MirageError('Something went wrong');
 * console.log(error.message); // => '[Mirage]: Something went wrong'
 */
export class MirageError extends Error {
  constructor(message: string) {
    super(`[Mirage]: ${message}`);
  }
}
