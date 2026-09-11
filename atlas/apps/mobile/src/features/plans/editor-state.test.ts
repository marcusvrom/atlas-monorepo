import { it, expect } from 'vitest';
import { randomUUID } from 'node:crypto';
import { WorkoutDay } from '@atlas/contracts';
import { createApiClient } from '@atlas/api-client';
import { addExercise, moveExercise, canPublish } from './editor-state';
it('reordena 12 exercícios sem perder séries nem repetir ordens', async () => {
  const api = createApiClient({ mode: 'mock', mock: { latencyMs: 0, errorRate: 0 } });
  const exercises = (await api.catalog.listExercises({ limit: 12 })).items;
  const day = WorkoutDay.parse({
    id: randomUUID(),
    label: 'A',
    slot: 1,
    estimatedMinutes: 0,
    exercises: exercises.map((ex, index) => addExercise(ex, index + 1)),
  });
  const moved = moveExercise(day, 0, 11);
  expect(moved.exercises[11]?.exerciseId).toBe(day.exercises[0]?.exerciseId);
  expect(moved.exercises.map((ex) => ex.order)).toEqual(
    Array.from({ length: 12 }, (_, i) => i + 1),
  );
  expect(canPublish({ name: 'Demo', goal: 'strength', days: [moved] })).toBe(true);
  expect(canPublish({ name: 'Demo', goal: 'strength', days: [] })).toBe(false);
});
