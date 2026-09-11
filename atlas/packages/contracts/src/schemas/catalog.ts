import { z } from 'zod';
import { Difficulty, Equipment, ExerciseId, MuscleRole } from '../primitives.js';

/**
 * Grupo muscular. `svgPathId` liga o dado ao <path> do SVG anatômico —
 * é o que permite o mesmo asset servir exercício, heatmap e mapa de dor.
 */
export const MuscleGroup = z.object({
  id: z.number().int().positive(),
  code: z.string().min(1),
  displayName: z.string().min(1),
  svgPathId: z.string().min(1),
  view: z.enum(['anterior', 'posterior', 'both']),
  parentId: z.number().int().positive().nullable(),
});
export type MuscleGroup = z.infer<typeof MuscleGroup>;

export const MuscleActivation = z.object({
  muscleGroupId: z.number().int().positive(),
  muscleCode: z.string().min(1),
  role: MuscleRole,
  /** 0..1 — peso usado no cálculo de volume ponderado. Ver @atlas/domain. */
  activationWeight: z.number().min(0).max(1),
});
export type MuscleActivation = z.infer<typeof MuscleActivation>;

export const ExerciseMedia = z.object({
  kind: z.enum(['loop', 'video', 'image']),
  url: z.url(),
  angle: z.enum(['front', 'side', 'rear']).optional(),
  durationMs: z.number().int().positive().optional(),
});
export type ExerciseMedia = z.infer<typeof ExerciseMedia>;

export const ExerciseSummary = z.object({
  id: ExerciseId,
  name: z.string().min(1),
  primaryMuscleCode: z.string().min(1),
  equipment: Equipment,
  difficulty: Difficulty,
  thumbnailUrl: z.url().nullable(),
  isCustom: z.boolean(),
});
export type ExerciseSummary = z.infer<typeof ExerciseSummary>;

export const ExerciseDetail = ExerciseSummary.extend({
  description: z.string(),
  media: z.array(ExerciseMedia),
  activations: z.array(MuscleActivation).min(1),
  executionCues: z.array(z.string()),
  commonMistakes: z.array(z.string()),
})
  // Invariante do domínio (spec 00 §4.2) validada também na fronteira.
  .refine((e) => e.activations.some((a) => a.role === 'primary'), {
    message: 'Exercício precisa de ao menos uma ativação primária',
    path: ['activations'],
  });
export type ExerciseDetail = z.infer<typeof ExerciseDetail>;

export const ExerciseFilter = z.object({
  query: z.string().optional(),
  muscleCode: z.string().optional(),
  equipment: Equipment.optional(),
  difficulty: Difficulty.optional(),
  cursor: z.string().nullable().optional(),
  limit: z.number().int().min(1).max(50).default(20),
});
export type ExerciseFilter = z.input<typeof ExerciseFilter>;
