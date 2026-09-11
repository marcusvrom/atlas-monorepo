import {
  DailyTargets,
  HydrationDay,
  LogWaterInput,
  type ActivityLevel,
  type BiologicalSex,
} from '@atlas/contracts';
import { ageFromBirthDate, dailyWaterMl, metabolicSummary, waterSchedule } from '@atlas/domain';
import type { NutritionPort } from '../ports/nutrition.port.js';
import type { MockStore } from './store.js';
import { simulate } from './runtime.js';

/**
 * ATL-NUT-001 — adapter mock.
 *
 * Calcula com o **mesmo** `@atlas/domain` que o backend usará na fase 2. Isso é
 * o que impede a demo de mostrar um número e a integração mostrar outro: a
 * fórmula é uma só e é versionada; o que muda é apenas quem a executa.
 *
 * Quando falta um dado do perfil, o adapter **não inventa** um valor médio.
 * Devolve a estimativa possível e lista o que faltou em `missingInputs`, para
 * a tela pedir o dado em vez de apresentar um chute como se fosse do usuário.
 */
const DEFAULT_WAKE = '07:00';
const DEFAULT_SLEEP = '23:00';
const DISCLAIMER_KEY = 'nutritionDisclaimer';

/** Peso mais recente registrado; sem medição, não há de onde tirar. */
function latestWeightKg(store: MockStore): number | null {
  const weights = store.measurements
    .filter((entry) => entry.weightKg !== null)
    .sort((a, b) => b.takenAt.localeCompare(a.takenAt));
  return weights[0]?.weightKg ?? null;
}

export class MockNutritionAdapter implements NutritionPort {
  constructor(private readonly store: MockStore) {}

  async getDailyTargets(): Promise<DailyTargets> {
    return simulate(this.store.config, () => {
      const me = this.store.me;
      const weightKg = latestWeightKg(this.store);
      const missing: DailyTargets['missingInputs'] = [];
      if (weightKg === null) missing.push('weight');
      if (me.heightCm === null) missing.push('height');
      if (me.birthDate === null) missing.push('birthDate');
      if (me.biologicalSex === null) missing.push('sex');
      if (me.goal === null) missing.push('goal');

      const nowIso = new Date().toISOString();
      const summary = metabolicSummary({
        weightKg: weightKg ?? 0,
        heightCm: me.heightCm ?? 0,
        ageYears: me.birthDate ? ageFromBirthDate(me.birthDate, nowIso) : 0,
        sex: (me.biologicalSex ?? 'unspecified') as BiologicalSex,
        activity: (me.activityLevel ?? 'moderate') as ActivityLevel,
        goal: me.goal?.type ?? 'generalHealth',
        targetWeightKg: me.goal?.targetWeightKg ?? null,
      });

      return DailyTargets.parse({
        formulaVersion: summary.version,
        basalKcal: summary.basalKcal,
        maintenanceKcal: summary.maintenanceKcal,
        goalAdjustmentKcal: summary.goalAdjustmentKcal,
        targetKcal: summary.targetKcal,
        macros: summary.macros,
        waterMl: summary.waterMl,
        missingInputs: missing,
        disclaimerKey: DISCLAIMER_KEY,
        computedAt: nowIso,
      });
    });
  }

  async getHydrationDay(date: string): Promise<HydrationDay> {
    return simulate(this.store.config, () => this.buildDay(date));
  }

  async logWater(input: LogWaterInput): Promise<HydrationDay> {
    const valid = LogWaterInput.parse(input);
    return simulate(this.store.config, () => {
      // R7: reenvio do mesmo copo é no-op, nunca soma duas vezes.
      if (!this.store.idempotencyKeys.has(valid.clientGeneratedId)) {
        this.store.idempotencyKeys.add(valid.clientGeneratedId);
        const current = this.store.hydration.get(valid.date) ?? 0;
        this.store.hydration.set(valid.date, current + valid.volumeMl);
      }
      return this.buildDay(valid.date);
    });
  }

  private buildDay(date: string): HydrationDay {
    const weightKg = latestWeightKg(this.store) ?? 0;
    const targetMl = dailyWaterMl(weightKg);
    return HydrationDay.parse({
      date,
      targetMl,
      consumedMl: this.store.hydration.get(date) ?? 0,
      schedule: waterSchedule(targetMl, DEFAULT_WAKE, DEFAULT_SLEEP),
    });
  }
}
