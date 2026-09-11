import { z } from 'zod';
import { ExerciseId, Instant } from '../primitives.js';

/** Alimenta o heatmap anatômico. Ver spec 00 §8.3 e §11.3. */
export const MuscleVolume = z.object({
  muscleGroupId: z.number().int().positive(),
  muscleCode: z.string(),
  displayName: z.string(),
  weightedVolumeKg: z.number().min(0),
  /**
   * Fracionário desde a v2 do cálculo: um agachamento vale uma série efetiva
   * para o quadríceps e cerca de meia para o glúteo. Inteiro obrigava a
   * escolher entre 1 e 0 para o sinergista, e a escolha era 0 — o que fazia o
   * glúteo de quem só agacha aparecer com "0 séries efetivas" ao lado de 25 t
   * de carga. Ver `weightedEffectiveSets` em @atlas/domain. A UI arredonda.
   */
  effectiveSets: z.number().min(0),
  /** 0..1, normalizado contra o grupo de maior volume no período. */
  intensity: z.number().min(0).max(1),
});
export type MuscleVolume = z.infer<typeof MuscleVolume>;

export const AdherenceSummary = z.object({
  periodDays: z.number().int().positive(),
  plannedSessions: z.number().int().min(0),
  completedSessions: z.number().int().min(0),
  rate: z.number().min(0).max(1),
  currentStreak: z.number().int().min(0),
});
export type AdherenceSummary = z.infer<typeof AdherenceSummary>;

export const ExerciseProgression = z.object({
  exerciseId: ExerciseId,
  exerciseName: z.string(),
  points: z.array(
    z.object({
      at: Instant,
      topSetWeightKg: z.number().min(0),
      topSetReps: z.number().int().min(0),
      estimatedOneRepMaxKg: z.number().min(0),
      totalVolumeKg: z.number().min(0),
    }),
  ),
  isStagnant: z.boolean(),
});
export type ExerciseProgression = z.infer<typeof ExerciseProgression>;
