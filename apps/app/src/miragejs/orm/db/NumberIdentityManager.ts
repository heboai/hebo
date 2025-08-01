import IdentityManager, { IdentityManagerOptions } from './IdentityManager';

/**
 * IdentityManager specifically configured for number IDs with sensible defaults
 * @example
 * const numberManager = new NumberIdentityManager();
 * numberManager.get(); // => 1
 * numberManager.fetch(); // => 1
 * numberManager.get(); // => 2
 */
export default class NumberIdentityManager extends IdentityManager<number> {
  constructor(options: IdentityManagerOptions<number> = {}) {
    super({
      initialCounter: 1,
      idGenerator: (currentId: number) => currentId + 1,
      ...options,
    });
  }
}
