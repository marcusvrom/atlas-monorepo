import { AppState } from 'react-native';
import * as Network from 'expo-network';
import type { ApiClient } from '@atlas/api-client';
import type { QueryClient } from '@tanstack/react-query';
import { getOfflineStore } from './database';
import { SyncEngine } from './sync-engine';
const engines = new WeakMap<ApiClient, Promise<SyncEngine>>();
const timers = new WeakMap<ApiClient, ReturnType<typeof setTimeout>>();
export async function kickSync(api: ApiClient, cache: QueryClient) {
  const network = await Network.getNetworkStateAsync();
  if (network.isConnected === false || network.isInternetReachable === false) return;
  let engine = engines.get(api);
  if (!engine) {
    engine = getOfflineStore().then(
      (store) =>
        new SyncEngine(store, api.session, () => {
          void cache.invalidateQueries({ queryKey: ['outbox'] });
        }),
    );
    engines.set(api, engine);
  }
  await (await engine).flush();
  await Promise.all([
    cache.invalidateQueries({ queryKey: ['outbox'] }),
    cache.invalidateQueries({ queryKey: ['session'] }),
    cache.invalidateQueries({ queryKey: ['insights'] }),
    cache.invalidateQueries({ queryKey: ['programming', 'today'] }),
  ]);
  const at = await (await getOfflineStore()).nextAttempt();
  const prior = timers.get(api);
  if (prior) clearTimeout(prior);
  if (at !== null)
    timers.set(
      api,
      setTimeout(
        () => {
          void kickSync(api, cache).catch(() => {});
        },
        Math.max(1000, at - Date.now()),
      ),
    );
}
export function watchSync(api: ApiClient, cache: QueryClient) {
  const trigger = () => {
    void kickSync(api, cache).catch(() => {});
  };
  const network = Network.addNetworkStateListener((state) => {
    if (state.isConnected) trigger();
  });
  const app = AppState.addEventListener('change', (state) => {
    if (state === 'active') trigger();
  });
  trigger();
  return () => {
    network.remove();
    app.remove();
    const timer = timers.get(api);
    if (timer) clearTimeout(timer);
  };
}
