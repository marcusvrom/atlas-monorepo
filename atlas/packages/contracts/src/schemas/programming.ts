import { z } from 'zod';
import { ExerciseId, GoalType, WorkoutDayId, WorkoutPlanId, UserId } from '../primitives.js';

export const SetPrescription = z.object({
  order: z.number().int().min(1),
  /** Prescrição por repetição, tempo ou distância — mutuamente exclusivas. */
  targetReps: z.number().int().min(1).nullable(),
  targetRepsMax: z.number().int().min(1).nullable(),
  targetDurationSeconds: z.number().int().min(1).nullable(),
  targetWeightKg: z.number().min(0).nullable(),
  targetRir: z.number().int().min(0).max(10).nullable(),
  targetRpe: z.number().min(1).max(10).nullable(),
  restSeconds: z.number().int().min(0),
  isWarmup: z.boolean().default(false),
});
export type SetPrescription = z.infer<typeof SetPrescription>;

export const SetTechnique = z.enum([
  'straight', 'superset', 'dropset', 'restPause', 'cluster',
  'amrap', 'emom', 'isometric',
]);
export type SetTechnique = z.infer<typeof SetTechnique>;

export const ExercisePrescription = z.object({
  order: z.number().int().min(1),
  exerciseId: ExerciseId,
  exerciseName: z.string().min(1),
  thumbnailUrl: z.url().nullable(),
  technique: SetTechnique.default('straight'),
  /** Agrupa exercícios de um superset/bi-set. Nulo = execução isolada. */
  supersetGroup: z.string().nullable(),
  notes: z.string().nullable(),
  sets: z.array(SetPrescription).min(1),
});
export type ExercisePrescription = z.infer<typeof ExercisePrescription>;

export const WorkoutDay = z.object({
  id: WorkoutDayId,
  label: z.string().min(1),
  slot: z.number().int().min(0).max(6).nullable(),
  estimatedMinutes: z.number().int().min(0),
  exercises: z.array(ExercisePrescription),
});
export type WorkoutDay = z.infer<typeof WorkoutDay>;

export const PlanStatus = z.enum(['draft', 'published', 'archived']);
export type PlanStatus = z.infer<typeof PlanStatus>;

export const PlanOrigin = z.enum(['selfCreated', 'fromTemplate', 'prescribed']);
export type PlanOrigin = z.infer<typeof PlanOrigin>;

export const WorkoutPlanSummary = z.object({
  id: WorkoutPlanId,
  name: z.string().min(1),
  goal: GoalType,
  status: PlanStatus,
  origin: PlanOrigin,
  version: z.number().int().min(1),
  dayCount: z.number().int().min(0),
  prescribedByName: z.string().nullable(),
  isActive: z.boolean(),
});
export type WorkoutPlanSummary = z.infer<typeof WorkoutPlanSummary>;

export const WorkoutPlan = WorkoutPlanSummary.extend({
  ownerId: UserId,
  days: z.array(WorkoutDay),
});
export type WorkoutPlan = z.infer<typeof WorkoutPlan>;

/** Agregação de caso de uso: a tela "Hoje" pede isto, não três endpoints. */
export const TodayWorkout = z.object({
  planId: WorkoutPlanId,
  planName: z.string(),
  day: WorkoutDay,
  estimatedVolumeKg: z.number().min(0),
  lastPerformedAt: z.string().nullable(),
  /** Sessão já iniciada e não concluída, se houver. */
  inProgressSessionId: z.string().nullable(),
});
export type TodayWorkout = z.infer<typeof TodayWorkout>;

export const CreatePlanInput = z.object({
  name: z.string().min(3).max(80),
  goal: GoalType,
});
export type CreatePlanInput = z.infer<typeof CreatePlanInput>;

/** ATL-PRG-002: somente rascunhos aceitam edição. */
export const UpdatePlanInput = CreatePlanInput.extend({ days: z.array(WorkoutDay) });
export type UpdatePlanInput = z.infer<typeof UpdatePlanInput>;
