import { createApiClient, defaultMockConfig } from '@atlas/api-client';
import type { ApiClient } from '@atlas/api-client';
import { createContext, useContext, useState, type ReactNode } from 'react';
import { getDemoSettings } from '../dev/demo-settings';

const ApiContext = createContext<ApiClient | null>(null);
export function ApiProvider({ children }: { children: ReactNode }) {
  // A configuração é lida a cada operação; a instância e a deduplicação permanecem.
  const [client] = useState(() =>
    createApiClient({
      mode: 'mock',
      mockRuntime: {
        seed: defaultMockConfig.seed,
        get plan() {
          return getDemoSettings().plan;
        },
        get role() {
          return getDemoSettings().role;
        },
        get clientCount() {
          return getDemoSettings().clientCount;
        },
        get latencyMs() {
          return getDemoSettings().latencyMs;
        },
        get errorRate() {
          return getDemoSettings().errorRate;
        },
      },
    }),
  );
  return <ApiContext.Provider value={client}>{children}</ApiContext.Provider>;
}
export function useApi(): ApiClient {
  const client = useContext(ApiContext);
  if (!client) throw new Error('useApi precisa estar dentro de <ApiProvider>');
  return client;
}
