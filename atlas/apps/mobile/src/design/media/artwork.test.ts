import { describe, expect, it } from 'vitest';
import { coverGlyphPaths } from './cover-art';
import {
  ARTWORK_ASPECT,
  VECTOR_ASPECT,
  artworkAspect,
  artworkAssetKeys,
  artworkContexts,
  artworkFor,
  contextsUsing,
  type ArtworkContext,
} from './artwork';

describe('registro de arte editorial', () => {
  it('responde a todo contexto declarado', () => {
    for (const context of artworkContexts) {
      const spec = artworkFor(context);
      expect(spec.seed.length).toBeGreaterThan(0);
      expect(coverGlyphPaths[spec.glyph]).toBeDefined();
    }
  });

  it('escolhe a arte pelo significado do momento', () => {
    const byContext = (context: ArtworkContext) => artworkFor(context).asset;
    expect(byContext('active-workout')).toBe('homeWorkout');
    expect(byContext('onboarding-training')).toBe('onboardingTrain');
    expect(byContext('empty-plan')).toBe('onboardingTrain');
    expect(byContext('progress-highlight')).toBe('onboardingProgress');
    expect(byContext('workout-completed')).toBe('onboardingProgress');
    expect(byContext('sign-in')).toBe('onboardingCoach');
    expect(byContext('coach-highlight')).toBe('onboardingCoach');
  });

  it('continua a capa do onboarding na tela de entrada', () => {
    expect(artworkFor('sign-in').seed).toBe(artworkFor('onboarding-coach').seed);
    expect(artworkFor('sign-in').asset).toBe(artworkFor('onboarding-coach').asset);
  });

  it('não deixa dois heros da home caírem na mesma foto', () => {
    expect(artworkFor('welcome-back').asset).not.toBe(artworkFor('active-workout').asset);
  });

  it('mantém a semente estável por contexto, para o fallback não trocar de cor', () => {
    expect(artworkFor('progress-highlight')).toEqual(artworkFor('progress-highlight'));
  });

  it('aceita contexto sem foto, servido só pela arte vetorial', () => {
    expect(artworkFor('nutrition-targets').asset).toBeNull();
    expect(artworkFor('nutrition-targets').glyph).toBe('flame');
  });

  it('trata toda arte editorial como decorativa por padrão', () => {
    expect(artworkContexts.every((context) => artworkFor(context).decorative)).toBe(true);
  });

  it('usa todos os arquivos empacotados — nenhum peso morto no bundle', () => {
    for (const key of artworkAssetKeys) expect(contextsUsing(key).length).toBeGreaterThan(0);
  });

  it('não deixa um único arquivo cobrir quase o app inteiro', () => {
    for (const key of artworkAssetKeys) {
      expect(contextsUsing(key).length).toBeLessThanOrEqual(Math.ceil(artworkContexts.length / 2));
    }
  });
});

describe('proporção das artes', () => {
  it('responde a todo contexto com uma proporção utilizável', () => {
    for (const context of artworkContexts) {
      const aspect = artworkAspect(context);
      expect(Number.isFinite(aspect)).toBe(true);
      expect(aspect).toBeGreaterThan(0);
    }
  });

  it('usa a proporção real do arquivo, que é retrato', () => {
    // Os assets são 1080x1440 e 960x1440. A caixa fixa de 212 pt que existia
    // antes cortava mais da metade da altura e decepava a figura central.
    for (const aspect of Object.values(ARTWORK_ASPECT)) expect(aspect).toBeLessThan(1);
    expect(artworkAspect('active-workout')).toBeCloseTo(960 / 1440, 5);
    expect(artworkAspect('onboarding-training')).toBeCloseTo(1080 / 1440, 5);
  });

  it('dá forma mais larga ao contexto que não tem foto para preservar', () => {
    expect(artworkAspect('nutrition-targets')).toBe(VECTOR_ASPECT);
    expect(VECTOR_ASPECT).toBeGreaterThan(1);
  });

  it('mede toda arte empacotada, sem chave faltando nem sobrando', () => {
    expect(Object.keys(ARTWORK_ASPECT).sort()).toEqual([...artworkAssetKeys].sort());
  });
});
