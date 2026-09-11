import { z } from 'zod';

/**
 * Primitivas compartilhadas. Ids são branded para impedir troca acidental
 * entre domínios (passar um ExerciseId onde se espera um PlanId).
 */
const brandedId = <B extends string>(brand: B) => z.uuid().brand<B>();

export const UserId = brandedId('UserId');
export const ExerciseId = brandedId('ExerciseId');
export const WorkoutPlanId = brandedId('WorkoutPlanId');
export const WorkoutDayId = brandedId('WorkoutDayId');
export const SessionId = brandedId('SessionId');
export const MeasurementId = brandedId('MeasurementId');
export const EngagementId = brandedId('EngagementId');

export type UserId = z.infer<typeof UserId>;
export type ExerciseId = z.infer<typeof ExerciseId>;
export type WorkoutPlanId = z.infer<typeof WorkoutPlanId>;
export type WorkoutDayId = z.infer<typeof WorkoutDayId>;
export type SessionId = z.infer<typeof SessionId>;
export type MeasurementId = z.infer<typeof MeasurementId>;
export type EngagementId = z.infer<typeof EngagementId>;

/** ISO-8601 em UTC. O app nunca troca Date cru pela fronteira. */
export const Instant = z.iso.datetime({ offset: true });
export type Instant = z.infer<typeof Instant>;

export const GoalType = z.enum([
  'hypertrophy',
  'fatLoss',
  'strength',
  'endurance',
  'rehabilitation',
  'generalHealth',
]);
export type GoalType = z.infer<typeof GoalType>;

export const MuscleRole = z.enum(['primary', 'secondary', 'stabilizer']);
export type MuscleRole = z.infer<typeof MuscleRole>;

export const Equipment = z.enum([
  'barbell', 'dumbbell', 'machine', 'cable', 'bodyweight',
  'kettlebell', 'band', 'ball', 'none',
]);
export type Equipment = z.infer<typeof Equipment>;

export const Difficulty = z.enum(['beginner', 'intermediate', 'advanced']);
export type Difficulty = z.infer<typeof Difficulty>;

/** Página com cursor opaco. O client nunca constrói cursor. */
export const page = <T extends z.ZodTypeAny>(item: T) =>
  z.object({ items: z.array(item), nextCursor: z.string().nullable() });

export type Page<T> = { items: T[]; nextCursor: string | null };
