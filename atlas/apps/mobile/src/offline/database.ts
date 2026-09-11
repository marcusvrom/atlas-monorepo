import { openLocalDatabase } from '../data/local-database';
import { OfflineStore } from './store';
let instance: Promise<OfflineStore> | undefined;
export function getOfflineStore() {
  instance ??= openLocalDatabase('atlas-offline.db')
    .then(async (db) => {
      const store = new OfflineStore(db);
      await store.initialize();
      return store;
    })
    .catch((error: unknown) => {
      instance = undefined;
      throw error;
    });
  return instance;
}
