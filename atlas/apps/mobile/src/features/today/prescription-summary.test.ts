import { describe, expect, it } from 'vitest';
import { ExercisePrescription } from '@atlas/contracts';
import { prescriptionSummary } from './prescription-summary';

const build = (sets: unknown[]) =>
  ExercisePrescription.parse({
    order: 1,
    exerciseId: '018f0000-0000-7000-8000-000000000001',
    exerciseName: 'Agachamento livre',
    thumbnailUrl: null,
    supersetGroup: null,
    notes: null,
    sets,
  });

describe('resumo de prescrição', () => {
  it('descreve séries por repetição com faixa', () => {
    const summary = prescriptionSummary(
      build([
        {
          order: 1,
          targetReps: 8,
          targetRepsMax: 12,
          targetDurationSeconds: null,
          targetWeightKg: 60,
          targetRir: 2,
          targetRpe: null,
          restSeconds: 90,
        },
        {
          order: 2,
          targetReps: 8,
          targetRepsMax: 12,
          targetDurationSeconds: null,
          targetWeightKg: 60,
          targetRir: 2,
          targetRpe: null,
          restSeconds: 90,
        },
      ]),
    );
    expect(summary.sets).toBe('2 × 8–12 reps');
    expect(summary.rest).toBe('90 s');
    expect(summary.rir).toBe('Repetições em reserva (RIR): 2');
    expect(summary.varies).toBe(false);
  });

  it('descreve séries por tempo', () => {
    const summary = prescriptionSummary(
      build([
        {
          order: 1,
          targetReps: null,
          targetRepsMax: null,
          targetDurationSeconds: 45,
          targetWeightKg: null,
          targetRir: null,
          targetRpe: null,
          restSeconds: 30,
        },
      ]),
    );
    expect(summary.sets).toBe('1 × 45 s');
    expect(summary.rir).toBeNull();
  });

  it('sinaliza quando as séries seguintes divergem da primeira', () => {
    const summary = prescriptionSummary(
      build([
        {
          order: 1,
          targetReps: 12,
          targetRepsMax: null,
          targetDurationSeconds: null,
          targetWeightKg: 40,
          targetRir: 3,
          targetRpe: null,
          restSeconds: 60,
        },
        {
          order: 2,
          targetReps: 8,
          targetRepsMax: null,
          targetDurationSeconds: null,
          targetWeightKg: 50,
          targetRir: 1,
          targetRpe: null,
          restSeconds: 60,
        },
      ]),
    );
    // O rótulo continua descrevendo a primeira série — o aviso é que há mais.
    expect(summary.sets).toBe('2 × 12 reps');
    expect(summary.varies).toBe(true);
  });
});
