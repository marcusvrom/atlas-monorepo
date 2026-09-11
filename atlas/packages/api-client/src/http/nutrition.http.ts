import { DailyTargets, HydrationDay, LogWaterInput } from '@atlas/contracts';
import type { NutritionPort } from '../ports/nutrition.port.js';
import type { HttpClient } from './http-client.js';

/**
 * ATL-NUT-001 — adapter HTTP.
 *
 * Paridade com o mock (R3): mesmos três métodos, mesmos schemas na fronteira.
 * O cálculo acontece no backend, que roda a mesma fórmula versionada de
 * `@atlas/domain`; o cliente valida o que chega e não recalcula nada.
 */
export class HttpNutritionAdapter implements NutritionPort {
  constructor(private readonly http: HttpClient) {}

  async getDailyTargets(): Promise<DailyTargets> {
    return this.http.request('/api/v1/nutrition/daily-targets', DailyTargets);
  }

  async getHydrationDay(date: string): Promise<HydrationDay> {
    return this.http.request('/api/v1/nutrition/hydration/' + date, HydrationDay);
  }

  async logWater(input: LogWaterInput): Promise<HydrationDay> {
    const valid = LogWaterInput.parse(input);
    return this.http.request('/api/v1/nutrition/hydration/' + valid.date + '/logs', HydrationDay, {
      method: 'POST',
      body: valid,
      idempotencyKey: valid.clientGeneratedId,
    });
  }
}
