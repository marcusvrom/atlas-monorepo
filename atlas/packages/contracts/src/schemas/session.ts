import { z } from 'zod';
import { ExerciseId, Instant, SessionId, WorkoutPlanId } from '../primitives.js';

/**
 * Série executada. APPEND-ONLY e idempotente por clientGeneratedId.
 * Essa decisão elimina a maior parte da complexidade de sync offline —
 * inserções nunca conflitam. Ver spec 00 §12.3 e AGENTS.md R7.
 */
export const PerformedSet = z.object({
  clientGeneratedId: z.uuid(),
  exerciseId: ExerciseId,
  order: z.number().int().min(1),
  weightKg: z.number().min(0).nullable(),
  reps: z.number().int().min(0).nullable(),
  durationSeconds: z.number().int().min(0).nullable(),
  rpe: z.number().min(1).max(10).nullable(),
  rir: z.number().int().min(0).max(10).nullable(),
  isWarmup: z.boolean().default(false),
  /** Coletado apenas em contexto de reabilitação. Ver spec 00 §4.4. */
  painLevel: z.number().int().min(0).max(10).nullable(),
  performedAt: Instant,
});
export type PerformedSet = z.infer<typeof PerformedSet>;

export const SessionStatus = z.enum(['inProgress', 'completed', 'abandoned']);
export type SessionStatus = z.infer<typeof SessionStatus>;

export const TrainingSession = z.object({
  id: SessionId,
  planId: WorkoutPlanId.nullable(),
  planVersion: z.number().int().min(1).nullable(),
  dayLabel: z.string(),
  status: SessionStatus,
  startedAt: Instant,
  completedAt: Instant.nullable(),
  sets: z.array(PerformedSet),
  totalVolumeKg: z.number().min(0),
  durationSeconds: z.number().int().min(0),
});
export type TrainingSession = z.infer<typeof TrainingSession>;

export const SessionSummary = TrainingSession.omit({ sets: true }).extend({
  setCount: z.number().int().min(0),
  exerciseCount: z.number().int().min(0),
});
export type SessionSummary = z.infer<typeof SessionSummary>;

export const StartSessionInput = z.object({
  clientGeneratedId: z.uuid(),
  planId: WorkoutPlanId.nullable(),
  dayId: z.string().nullable(),
});
export type StartSessionInput = z.infer<typeof StartSessionInput>;

/** Resultado particionado do sync em lote. Um item inválido nunca invalida o lote. */
export const LogSetsResult = z.object({
  accepted: z.array(z.uuid()),
  duplicated: z.array(z.uuid()),
  rejected: z.array(z.object({ clientGeneratedId: z.uuid(), reason: z.string() })),
});
export type LogSetsResult = z.infer<typeof LogSetsResult>;
