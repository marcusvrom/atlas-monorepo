import {MockWellbeingAdapter} from './mock/wellbeing.mock.js';
import {HttpWellbeingAdapter} from './http/wellbeing.http.js';
import { HttpCatalogAdapter } from './http/catalog.http.js';
import { HttpClient } from './http/http-client.js';
import { HttpProgrammingAdapter } from './http/programming.http.js';
import { HttpSessionAdapter } from './http/session.http.js';
import {
  HttpCoachingAdapter,
  HttpIdentityAdapter,
  HttpInsightsAdapter,
  HttpMeasurementAdapter,
} from './http/stubs.http.js';
import { MockCatalogAdapter } from './mock/catalog.mock.js';
import { MockCoachingAdapter } from './mock/coaching.mock.js';
import { MockIdentityAdapter } from './mock/identity.mock.js';
import { MockInsightsAdapter } from './mock/insights.mock.js';
import { MockMeasurementAdapter } from './mock/measurement.mock.js';
import { MockProgrammingAdapter } from './mock/programming.mock.js';
import { MockSessionAdapter } from './mock/session.mock.js';
import { defaultMockConfig, type MockRuntimeConfig } from './mock/runtime.js';
import { createMockStore } from './mock/store.js';
import type { ApiClient } from './ports/index.js';

export * from './errors.js';
export * from './ports/index.js';
export { defaultMockConfig } from './mock/runtime.js';
export type { MockRuntimeConfig } from './mock/runtime.js';
export type { MockStore } from './mock/store.js';

export type ApiMode = 'mock' | 'http';

export interface CreateApiClientOptions {
  mode: ApiMode;
  baseUrl?: string;
  getAccessToken?: () => Promise<string | null>;
  timeoutMs?: number;
  mock?: Partial<MockRuntimeConfig>;
  /** Configuração compartilhada para demonstração, sem recriar o estado. */
  mockRuntime?: MockRuntimeConfig;
  /**
   * Migração gradual: força domínios específicos para HTTP enquanto o resto
   * segue em mock. Permite migrar um domínio por vez mantendo o app
   * apresentável durante toda a transição. Ver spec 12 §6.
   */
  httpOverrides?: Partial<Record<keyof Omit<ApiClient, 'mode'>, boolean>>;
}

/**
 * Ponto ÚNICO de composição da camada de dados.
 *
 * Trocar mock por HTTP é trocar `mode`. Nenhuma tela, hook ou tipo muda.
 * Ver ADR-0014.
 */
export function createApiClient(options: CreateApiClientOptions): ApiClient {
  const mockConfig: MockRuntimeConfig = options.mockRuntime ?? {
    ...defaultMockConfig,
    ...options.mock,
  };
  const store = createMockStore(mockConfig);

  const mock = {
    wellbeing:new MockWellbeingAdapter(store),
    catalog: new MockCatalogAdapter(store),
    programming: new MockProgrammingAdapter(store),
    session: new MockSessionAdapter(store),
    measurement: new MockMeasurementAdapter(store),
    insights: new MockInsightsAdapter(store),
    coaching: new MockCoachingAdapter(store),
    identity: new MockIdentityAdapter(store),
  } as const;

  if (options.mode === 'mock' && !options.httpOverrides) {
    return { mode: 'mock', ...mock };
  }

  const baseUrl = options.baseUrl;
  if (!baseUrl) throw new Error('baseUrl é obrigatório quando mode = "http"');

  const http = new HttpClient({
    baseUrl,
    ...(options.getAccessToken ? { getAccessToken: options.getAccessToken } : {}),
    ...(options.timeoutMs !== undefined ? { timeoutMs: options.timeoutMs } : {}),
  });

  const httpAdapters = {
    wellbeing:new HttpWellbeingAdapter(http),
    catalog: new HttpCatalogAdapter(http),
    programming: new HttpProgrammingAdapter(http),
    session: new HttpSessionAdapter(http),
    measurement: new HttpMeasurementAdapter(http),
    insights: new HttpInsightsAdapter(http),
    coaching: new HttpCoachingAdapter(http),
    identity: new HttpIdentityAdapter(http),
  } as const;

  const shouldUseHttp = (domain: keyof typeof httpAdapters): boolean =>
    options.httpOverrides?.[domain] ?? options.mode === 'http';

  return {
    mode: options.mode,
    wellbeing: shouldUseHttp('wellbeing') ? httpAdapters.wellbeing : mock.wellbeing,
    catalog: shouldUseHttp('catalog') ? httpAdapters.catalog : mock.catalog,
    programming: shouldUseHttp('programming') ? httpAdapters.programming : mock.programming,
    session: shouldUseHttp('session') ? httpAdapters.session : mock.session,
    measurement: shouldUseHttp('measurement') ? httpAdapters.measurement : mock.measurement,
    insights: shouldUseHttp('insights') ? httpAdapters.insights : mock.insights,
    coaching: shouldUseHttp('coaching') ? httpAdapters.coaching : mock.coaching,
    identity: shouldUseHttp('identity') ? httpAdapters.identity : mock.identity,
  };
}
