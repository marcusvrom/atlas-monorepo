import { describe, expect, it } from 'vitest';
import { createApiClient } from './index.js';
import { assessExercise } from '@atlas/domain';

const api = () => createApiClient({ mode: 'mock', mock: { latencyMs: 0, errorRate: 0 } });

async function allExercises(client: ReturnType<typeof api>, filter = {}) {
  const items = [];
  let cursor: string | null = null;
  do {
    const page = await client.catalog.listExercises({ ...filter, cursor, limit: 50 });
    items.push(...page.items);
    cursor = page.nextCursor;
  } while (cursor);
  return items;
}

describe('carga articular no catálogo', () => {
  it('etiqueta todo exercício, ainda que com lista vazia', async () => {
    const all = await allExercises(api());
    expect(all.length).toBeGreaterThan(0);
    for (const exercise of all) expect(Array.isArray(exercise.stressedRegions)).toBe(true);
  });

  it('é discriminante: sobra catálogo depois de excluir qualquer região', async () => {
    const client = api();
    const all = await allExercises(client);
    const regions = [...new Set(all.flatMap((e) => e.stressedRegions))];
    expect(regions.length).toBeGreaterThan(3);

    for (const region of regions) {
      const remaining = await allExercises(client, { protectedRegions: [region] });
      // Um filtro que zera o catálogo é indistinguível de um filtro quebrado.
      expect(remaining.length).toBeGreaterThan(all.length / 2);
      expect(remaining.every((e) => !e.stressedRegions.includes(region))).toBe(true);
    }
  });

  it('não filtra nada quando o usuário não declarou preferência', async () => {
    const client = api();
    expect((await allExercises(client, {})).length).toBe((await allExercises(client)).length);
  });

  it('remove de fato o exercício que carrega a região protegida', async () => {
    const client = api();
    const withKnee = await allExercises(client);
    const withoutKnee = await allExercises(client, { protectedRegions: ['knee'] });
    expect(withoutKnee.length).toBeLessThan(withKnee.length);
    expect(withoutKnee.some((e) => e.name.toLowerCase().includes('extensora'))).toBe(false);
  });

  it('mantém peso do corpo disponível para quem só tem halteres', async () => {
    const client = api();
    const items = await allExercises(client, { availableEquipment: ['dumbbell'] });
    expect(items.some((e) => e.equipment === 'bodyweight')).toBe(true);
    expect(items.every((e) => ['dumbbell', 'bodyweight', 'none'].includes(e.equipment))).toBe(true);
  });

  it('concorda com o domínio sobre o que ficou de fora', async () => {
    const client = api();
    const preferences = {
      experienceLevel: 'advanced' as const,
      protectedRegions: ['shoulder' as const],
      availableEquipment: null,
    };
    const filtered = await allExercises(client, { protectedRegions: ['shoulder'] });
    for (const exercise of filtered) {
      expect(assessExercise(exercise, preferences).verdict).not.toBe('avoid');
    }
  });
});

describe('preferências no perfil', () => {
  it('persiste e devolve o que o onboarding gravou', async () => {
    const client = api();
    const saved = await client.identity.updateProfile({
      displayName: 'Demo',
      heightCm: 175,
      birthDate: null,
      biologicalSex: 'female',
      activityLevel: 'moderate',
      trainingPreferences: {
        experienceLevel: 'beginner',
        protectedRegions: ['lowerBack'],
        availableEquipment: ['dumbbell', 'band'],
      },
    });
    expect(saved.trainingPreferences?.experienceLevel).toBe('beginner');
    expect(saved.trainingPreferences?.protectedRegions).toEqual(['lowerBack']);
    expect((await client.identity.getMe()).trainingPreferences?.availableEquipment).toEqual([
      'dumbbell',
      'band',
    ]);
  });

  it('aceita voltar a não ter preferência declarada', async () => {
    const client = api();
    const saved = await client.identity.updateProfile({
      displayName: 'Demo',
      heightCm: null,
      birthDate: null,
      biologicalSex: null,
      activityLevel: null,
      trainingPreferences: null,
    });
    expect(saved.trainingPreferences).toBeNull();
  });
});

describe('foto de perfil', () => {
  it('grava e remove a foto sem tocar no resto do perfil', async () => {
    const client = api();
    const before = await client.identity.getMe();
    const withPhoto = await client.identity.updateProfilePhoto('file:///tmp/eu.jpg');
    expect(withPhoto.photoUri).toBe('file:///tmp/eu.jpg');
    expect(withPhoto.displayName).toBe(before.displayName);
    expect((await client.identity.updateProfilePhoto(null)).photoUri).toBeNull();
  });

  it('recusa string vazia — ausência de foto é `null`, não ""', async () => {
    await expect(api().identity.updateProfilePhoto('')).rejects.toThrow();
  });
});
