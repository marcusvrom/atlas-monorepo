import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { ExerciseDetail, PerformedSet, TrainingSession } from '@atlas/contracts';
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
