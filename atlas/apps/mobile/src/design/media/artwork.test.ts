import { describe, expect, it } from 'vitest';
import { coverGlyphPaths } from './cover-art';
import {
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
