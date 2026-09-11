import type { DailyTargets, HydrationDay, LogWaterInput } from '@atlas/contracts';

/**
 * ATL-NUT-001 — metas metabólicas e hidratação.
 *
 * `getDailyTargets` devolve a estimativa já calculada pela fonte de verdade do
 * estágio: no mock, pelo próprio `@atlas/domain`; em HTTP, pelo backend, que
 * roda a mesma fórmula versionada. A tela nunca calcula — é isso que garante
 * que o número mostrado hoje seja o mesmo número que o backend registrará
 * amanhã.
 */
export interface NutritionPort {
  getDailyTargets(): Promise<DailyTargets>;
  getHydrationDay(date: string): Promise<HydrationDay>;
  logWater(input: LogWaterInput): Promise<HydrationDay>;
}
