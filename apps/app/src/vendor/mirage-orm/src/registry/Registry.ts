import IdentityManager from '@src/db/IdentityManager';
import type { FactoryInstance } from '@src/factory';
import type { ModelClass } from '@src/model';

class RegistryItemManager<T> extends Map<string, T> {
  get<R extends T>(name: string): R {
    const item = super.get(name);
    if (!item) {
      throw new Error(`No item registered for '${name}'`);
    }
    return item as R;
  }

  set(name: string, item: T): this {
    if (this.has(name)) {
      throw new Error(`Item '${name}' is already registered`);
    }
    return super.set(name, item);
  }
}

/**
 * Registry class for storing user-defined model classes, factories, and identity managers
 */
export default class Registry {
  public readonly factories: RegistryItemManager<FactoryInstance<any>>;
  public readonly identityManagers: RegistryItemManager<IdentityManager<any>>;
  public readonly models: RegistryItemManager<ModelClass<any>>;

  constructor() {
    this.factories = new RegistryItemManager<FactoryInstance<any>>();
    this.identityManagers = new RegistryItemManager<IdentityManager<any>>();
    this.models = new RegistryItemManager<ModelClass<any>>();
  }
}
