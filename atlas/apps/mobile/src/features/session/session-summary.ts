import type { TrainingSession } from '@atlas/contracts';
import { estimateOneRepMax } from '@atlas/domain';
export function sessionRecords(session: TrainingSession, previous: TrainingSession | null) {
  if (!previous) return [];
  const best = new Map<string, number>();
  for (const set of previous.sets) {
    if (set.weightKg !== null && set.reps !== null && !set.isWarmup)
      best.set(
        set.exerciseId,
        Math.max(best.get(set.exerciseId) ?? 0, estimateOneRepMax(set.weightKg, set.reps)),
      );
  }
  const records = new Set<string>();
  for (const set of session.sets) {
    if (
      set.weightKg !== null &&
      set.reps !== null &&
      !set.isWarmup &&
      best.has(set.exerciseId) &&
      estimateOneRepMax(set.weightKg, set.reps) > best.get(set.exerciseId)!
    )
      records.add(set.exerciseId);
  }
  return [...records];
}
export function remainingRest(deadline: number, now: number) {
  'worklet';
  return Math.max(0, Math.ceil((deadline - now) / 1000));
}
