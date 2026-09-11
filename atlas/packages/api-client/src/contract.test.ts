import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { ExerciseDetail, PerformedSet, TrainingSession } from '@atlas/contracts';
import { METABOLISM_VERSION } from '@atlas/domain';
import { createApiClient } from './index.js';

/**
 * Testes de CONTRATO. Esta suíte é a que sobrevive à Fase 2: ela deve rodar
 * igual contra o adapter mock e contra o backend real, e é o que garante que a
 * troca de transporte não muda comportamento observável.
 */
const api = createApiClient({ mode: 'mock', mock: { latencyMs: 0, errorRate: 0 } });

describe('catálogo', () => {
  it('devolve exercícios válidos segundo o schema público', async () => {
    const page = await api.catalog.listExercises({ limit: 5 });
    expect(page.items.length).toBeGreaterThan(0);

    const detail = await api.catalog.getExercise(page.items[0]!.id);
    expect(() => ExerciseDetail.parse(detail)).not.toThrow();
    expect(detail.activations.some((a) => a.role === 'primary')).toBe(true);
  });

  it('pagina com cursor opaco', async () => {
    const first = await api.catalog.listExercises({ limit: 3 });
    expect(first.nextCursor).not.toBeNull();
    const second = await api.catalog.listExercises({ limit: 3, cursor: first.nextCursor });
    expect(second.items[0]?.id).not.toBe(first.items[0]?.id);
  });
});

describe('sessão de treino', () => {
  it('é idempotente no registro de séries', async () => {
    const session = await api.session.startSession({
      clientGeneratedId: randomUUID(),
      planId: null,
      dayId: null,
    });

    const exercise = (await api.catalog.listExercises({ limit: 1 })).items[0]!;
    const set = PerformedSet.parse({
      clientGeneratedId: randomUUID(),
      exerciseId: exercise.id,
      order: 1,
      weightKg: 80,
      reps: 8,
      durationSeconds: null,
      rpe: null,
      rir: 2,
      isWarmup: false,
      painLevel: null,
      performedAt: new Date().toISOString(),
    });

    const first = await api.session.logSets(session.id, [set]);
    expect(first.accepted).toHaveLength(1);

    // Reenviar o MESMO lote não pode duplicar. Ver AGENTS.md R7.
    const retry = await api.session.logSets(session.id, [set]);
    expect(retry.accepted).toHaveLength(0);
    expect(retry.duplicated).toHaveLength(1);

    const reloaded = await api.session.getSession(session.id);
    expect(reloaded.sets).toHaveLength(1);
    expect(() => TrainingSession.parse(reloaded)).not.toThrow();
  });

  it('particiona o resultado em vez de rejeitar o lote inteiro', async () => {
    const session = await api.session.startSession({
      clientGeneratedId: randomUUID(),
      planId: null,
      dayId: null,
    });
    const exercise = (await api.catalog.listExercises({ limit: 1 })).items[0]!;

    const valid = {
      clientGeneratedId: randomUUID(),
      exerciseId: exercise.id,
      order: 1,
      weightKg: 60,
      reps: 10,
      durationSeconds: null,
      rpe: null,
      rir: 2,
      isWarmup: false,
      painLevel: null,
      performedAt: new Date().toISOString(),
    };
    const unknownExercise = { ...valid, clientGeneratedId: randomUUID(), exerciseId: randomUUID() };

    const result = await api.session.logSets(session.id, [valid, unknownExercise] as never);
    expect(result.accepted).toHaveLength(1);
    expect(result.rejected).toHaveLength(1);
    expect(result.rejected[0]?.reason).toBe('exercise_not_found');
  });
});

describe('paywall', () => {
  it('lança quotaExceeded com dados suficientes para a UI decidir o upgrade', async () => {
    await expect(async () => {
      for (let i = 0; i < 6; i++) {
        await api.programming.createPlan({ name: `Ficha ${i}`, goal: 'hypertrophy' });
      }
    }).rejects.toMatchObject({
      code: 'quotaExceeded',
      details: { feature: 'activeWorkoutPlans', suggestedUpgrade: 'pro' },
    });
  });
});

describe('insights', () => {
  it('calcula volume ponderado por grupo muscular a partir do histórico', async () => {
    const volume = await api.insights.getMuscleVolume({ periodDays: 30 });
    expect(volume.length).toBeGreaterThan(0);
    expect(volume[0]!.intensity).toBeLessThanOrEqual(1);
    // ordenado por volume decrescente — é o que o heatmap consome
    expect(volume[0]!.weightedVolumeKg).toBeGreaterThanOrEqual(
      volume[volume.length - 1]!.weightedVolumeKg,
    );
  });
});

describe('nutrição e hidratação', () => {
  it('deriva as metas do perfil com a fórmula versionada do domínio', async () => {
    const targets = await api.nutrition.getDailyTargets();
    expect(targets.formulaVersion).toBe(METABOLISM_VERSION);
    expect(targets.basalKcal).toBeGreaterThan(0);
    // Hipertrofia é o objetivo semente: o alvo fica acima da manutenção.
    expect(targets.targetKcal).toBeGreaterThan(targets.maintenanceKcal);
    expect(targets.macros.proteinG).toBeGreaterThan(0);
    expect(targets.waterMl).toBeGreaterThan(0);
  });

  it('exige o aviso de que a estimativa não é prescrição', async () => {
    const targets = await api.nutrition.getDailyTargets();
    expect(targets.disclaimerKey.length).toBeGreaterThan(0);
  });

  it('não reporta dado faltando quando o perfil semente está completo', async () => {
    expect((await api.nutrition.getDailyTargets()).missingInputs).toEqual([]);
  });

  it('soma o copo registrado e ignora o reenvio do mesmo id', async () => {
    const date = '2026-09-11';
    const before = await api.nutrition.getHydrationDay(date);
    const log = { clientGeneratedId: randomUUID(), date, volumeMl: 250 };

    const after = await api.nutrition.logWater(log);
    expect(after.consumedMl).toBe(before.consumedMl + 250);

    // R7: reenvio é no-op, nunca soma duas vezes.
    const retry = await api.nutrition.logWater(log);
    expect(retry.consumedMl).toBe(after.consumedMl);
  });

  it('distribui a meta de água em lembretes que somam exatamente a meta', async () => {
    const day = await api.nutrition.getHydrationDay('2026-09-12');
    expect(day.schedule.length).toBeGreaterThan(1);
    expect(day.schedule.reduce((sum, item) => sum + item.volumeMl, 0)).toBe(day.targetMl);
  });

  it('rejeita volume fora da faixa na fronteira, não na tela', async () => {
    await expect(
      api.nutrition.logWater({ clientGeneratedId: randomUUID(), date: '2026-09-11', volumeMl: 0 }),
    ).rejects.toThrow();
  });
});
