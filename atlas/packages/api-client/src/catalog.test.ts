import { describe, expect, it } from 'vitest';
import { ExerciseDetail, ExerciseSummary, page } from '@atlas/contracts';
import { createApiClient } from './index';
const api = createApiClient({ mode: 'mock', mock: { latencyMs: 0, errorRate: 0 } });
describe('expanded catalog', () => {
  it('paginates all 60 unique exercises and validates their muscle weights', async () => {
    const ids = new Set<string>();
    let cursor: string | null = null;
    do {
      const result = page(ExerciseSummary).parse(
        await api.catalog.listExercises({ limit: 20, cursor }),
      );
      for (const item of result.items) {
        expect(ids.has(item.id)).toBe(false);
        ids.add(item.id);
        const detail = ExerciseDetail.parse(await api.catalog.getExercise(item.id));
        expect(
          detail.activations
            .filter((a) => a.role === 'primary')
            .reduce((sum, a) => sum + a.activationWeight, 0),
        ).toBeLessThanOrEqual(1);
      }
      cursor = result.nextCursor;
    } while (cursor);
    expect(ids.size).toBe(60);
  });
  it('matches accents and combined filters', async () => {
    const result = await api.catalog.listExercises({
      query: 'elevacao',
      equipment: 'dumbbell',
      muscleCode: 'lateral_deltoid',
    });
    expect(result.items.length).toBeGreaterThan(0);
    expect(
      result.items.every(
        (item) => item.equipment === 'dumbbell' && item.primaryMuscleCode === 'lateral_deltoid',
      ),
    ).toBe(true);
  });
  it('has a defined empty result', async () =>
    expect((await api.catalog.listExercises({ query: 'zzzz-no-match' })).items).toEqual([]));
});
