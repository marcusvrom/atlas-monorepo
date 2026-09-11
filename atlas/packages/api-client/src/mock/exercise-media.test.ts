import { describe, expect, it } from 'vitest';
import exercisesFixture from './fixtures/exercises.json' with { type: 'json' };
import { exerciseImageUrl, exerciseMediaIds } from './exercise-media.js';

describe('exercise media coverage', () => {
  it('maps every catalog exercise to a reviewed image pair', () => {
    const slugs = exercisesFixture.map((exercise) => exercise.slug).sort();
    expect(Object.keys(exerciseMediaIds).sort()).toEqual(slugs);
  });

  it('builds stable public-domain image URLs', () => {
    expect(exerciseImageUrl('supino-reto-barra', 0)).toBe(
      'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Bench_Press_-_Medium_Grip/0.jpg',
    );
  });
});
