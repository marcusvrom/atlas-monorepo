import {
  ExercisePrescription,
  SetPrescription,
  WorkoutDay,
  UpdatePlanInput,
  type ExerciseSummary,
} from '@atlas/contracts';
export function emptyDay(id: string, index: number, label: string) {
  return WorkoutDay.parse({ id, label, slot: index % 7, estimatedMinutes: 0, exercises: [] });
}
export function defaultSet(order: number) {
  return SetPrescription.parse({
    order,
    targetReps: 10,
    targetRepsMax: 12,
    targetDurationSeconds: null,
    targetWeightKg: null,
    targetRir: 2,
    targetRpe: null,
    restSeconds: 60,
    isWarmup: false,
  });
}
export function addExercise(exercise: ExerciseSummary, order: number) {
  return ExercisePrescription.parse({
    order,
    exerciseId: exercise.id,
    exerciseName: exercise.name,
    thumbnailUrl: exercise.thumbnailUrl,
    technique: 'straight',
    supersetGroup: null,
    notes: null,
    sets: [defaultSet(1)],
  });
}
export function moveExercise(day: WorkoutDay, from: number, to: number): WorkoutDay {
  const exercises = [...day.exercises];
  const item = exercises.splice(from, 1)[0];
  if (!item) return day;
  exercises.splice(Math.max(0, Math.min(to, exercises.length)), 0, item);
  return { ...day, exercises: exercises.map((ex, index) => ({ ...ex, order: index + 1 })) };
}
export function canPublish(input: UpdatePlanInput) {
  return input.days.length > 0 && input.days.every((day) => day.exercises.length > 0);
}
