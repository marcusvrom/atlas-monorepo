import { describe, expect, it } from 'vitest';
import {
  assessExercise,
  difficultyRank,
  isExcluded,
  rankByFit,
  saferAlternative,
  type FitCandidate,
  type FitPreferences,
} from './exercise-fit.js';

const squat: FitCandidate & { primaryMuscleCode: string; name: string } = {
  name: 'Agachamento livre',
  primaryMuscleCode: 'quadriceps',
  difficulty: 'advanced',
  equipment: 'barbell',
  stressedRegions: ['knee', 'lowerBack', 'hip', 'ankle'],
};

const legPress: FitCandidate & { primaryMuscleCode: string; name: string } = {
  name: 'Leg press 45',
  primaryMuscleCode: 'quadriceps',
  difficulty: 'beginner',
  equipment: 'machine',
  stressedRegions: ['knee'],
};

const hackSquat = { ...legPress, name: 'Agachamento hack', stressedRegions: ['knee'] as const };

const legCurl: FitCandidate & { primaryMuscleCode: string; name: string } = {
  name: 'Mesa flexora',
  primaryMuscleCode: 'quadriceps',
  difficulty: 'beginner',
  equipment: 'machine',
  stressedRegions: [],
};

const pushUp: FitCandidate & { primaryMuscleCode: string; name: string } = {
  name: 'Flexão de braços',
  primaryMuscleCode: 'pectoralis_major',
  difficulty: 'intermediate',
  equipment: 'bodyweight',
  stressedRegions: ['wrist'],
};

const preferences = (patch: Partial<FitPreferences> = {}): FitPreferences => ({
  experienceLevel: 'intermediate',
  protectedRegions: [],
  availableEquipment: null,
  ...patch,
});

describe('sem preferências declaradas', () => {
  it('não filtra nada — o app não inventa um perfil que o usuário não deu', () => {
    const fit = assessExercise(squat, null);
    expect(fit.verdict).toBe('suitable');
    expect(fit.reasons).toEqual([]);
    expect(isExcluded(fit)).toBe(false);
  });

  it('não sugere alternativa quando não sabe o que proteger', () => {
    expect(saferAlternative(squat, [legPress], null)).toBeNull();
  });
});

describe('limitação declarada', () => {
  it('marca para evitar e diz qual região motivou', () => {
    const fit = assessExercise(squat, preferences({ protectedRegions: ['knee'] }));
    expect(fit.verdict).toBe('avoid');
    expect(fit.reasons).toContainEqual({ code: 'protectedRegion', region: 'knee' });
  });

  it('nomeia todas as regiões em conflito, não só a primeira', () => {
    const fit = assessExercise(squat, preferences({ protectedRegions: ['knee', 'lowerBack'] }));
    const regions = fit.reasons.filter((r) => r.code === 'protectedRegion').map((r) => r.region);
    expect(regions).toEqual(['knee', 'lowerBack']);
  });

  it('afunda mais o exercício que conflita com mais regiões', () => {
    const both = assessExercise(squat, preferences({ protectedRegions: ['knee', 'hip'] }));
    const one = assessExercise(legPress, preferences({ protectedRegions: ['knee', 'hip'] }));
    expect(both.score).toBeLessThan(one.score);
  });

  it('promove quem poupa a região protegida', () => {
    const fit = assessExercise(legCurl, preferences({ protectedRegions: ['knee'] }));
    expect(fit.verdict).toBe('recommended');
    expect(fit.reasons).toContainEqual({ code: 'jointFriendly' });
  });

  it('não promove por "poupa a articulação" quem não declarou limitação', () => {
    const fit = assessExercise(legCurl, preferences());
    expect(fit.reasons).not.toContainEqual({ code: 'jointFriendly' });
  });
});

describe('nível de experiência', () => {
  it('trata exercício acima do nível como cautela, não como proibição', () => {
    const fit = assessExercise(squat, preferences({ experienceLevel: 'beginner' }));
    expect(fit.verdict).toBe('caution');
    expect(fit.reasons).toContainEqual({ code: 'aboveLevel' });
    expect(isExcluded(fit)).toBe(false);
  });

  it('mantém o exercício simples disponível para quem é avançado', () => {
    const fit = assessExercise(legCurl, preferences({ experienceLevel: 'advanced' }));
    expect(isExcluded(fit)).toBe(false);
    expect(fit.reasons).toContainEqual({ code: 'wellBelowLevel' });
  });

  it('prefere o que está exatamente no nível', () => {
    const onLevel = assessExercise(pushUp, preferences({ experienceLevel: 'intermediate' }));
    const below = assessExercise(legCurl, preferences({ experienceLevel: 'intermediate' }));
    expect(onLevel.score).toBeGreaterThan(below.score);
    expect(onLevel.reasons).toContainEqual({ code: 'matchesLevel' });
  });

  it('conflito articular pesa mais que desnível técnico', () => {
    const joint = assessExercise(legPress, preferences({ protectedRegions: ['knee'] }));
    const level = assessExercise(squat, preferences({ experienceLevel: 'beginner' }));
    expect(joint.verdict).toBe('avoid');
    expect(level.verdict).toBe('caution');
  });

  it('ordena a escala de dificuldade de forma comparável', () => {
    expect(difficultyRank('beginner')).toBeLessThan(difficultyRank('intermediate'));
    expect(difficultyRank('intermediate')).toBeLessThan(difficultyRank('advanced'));
  });
});

describe('equipamento disponível', () => {
  it('exclui o que exige equipamento que a pessoa não tem', () => {
    const fit = assessExercise(squat, preferences({ availableEquipment: ['dumbbell'] }));
    expect(fit.verdict).toBe('avoid');
    expect(fit.reasons).toContainEqual({ code: 'equipmentUnavailable', equipment: 'barbell' });
  });

  it('nunca barra peso do corpo — quem só tem o corpo ainda tem o corpo', () => {
    const fit = assessExercise(pushUp, preferences({ availableEquipment: [] }));
    expect(isExcluded(fit)).toBe(false);
  });

  it('não restringe nada quando o equipamento não foi declarado', () => {
    expect(isExcluded(assessExercise(squat, preferences({ availableEquipment: null })))).toBe(
      false,
    );
  });
});

describe('ordenação', () => {
  it('põe o adequado na frente e o inadequado no fim', () => {
    const ranked = rankByFit(
      [squat, legPress, legCurl],
      preferences({ protectedRegions: ['knee'], experienceLevel: 'beginner' }),
    );
    expect(ranked[0]!.exercise.name).toBe('Mesa flexora');
    expect(ranked.at(-1)!.exercise.name).toBe('Agachamento livre');
  });

  it('preserva a ordem de catálogo no empate', () => {
    const ranked = rankByFit([legPress, hackSquat], preferences());
    expect(ranked.map((item) => item.exercise.name)).toEqual(['Leg press 45', 'Agachamento hack']);
  });

  it('devolve lista vazia sem inventar item', () => {
    expect(rankByFit([], preferences())).toEqual([]);
  });
});

describe('alternativa mais segura', () => {
  it('troca por um exercício do mesmo grupo que poupa a região', () => {
    const alternative = saferAlternative(
      squat,
      [squat, legPress, legCurl],
      preferences({ protectedRegions: ['knee'] }),
    );
    expect(alternative?.name).toBe('Mesa flexora');
  });

  it('devolve nulo em vez de sugerir algo que agride a mesma articulação', () => {
    const alternative = saferAlternative(
      squat,
      [squat, legPress, hackSquat],
      preferences({ protectedRegions: ['knee'] }),
    );
    expect(alternative).toBeNull();
  });

  it('não sugere o próprio exercício', () => {
    expect(saferAlternative(legCurl, [legCurl], preferences())).toBeNull();
  });
});
