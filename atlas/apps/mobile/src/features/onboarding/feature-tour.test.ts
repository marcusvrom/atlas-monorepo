import { describe, expect, it } from 'vitest';
import messages from '../../i18n/pt-BR.json';
import { coverGlyphPaths } from '../../design/media/cover-art';
import { TOUR_EXEMPT_ROUTES, TOUR_VERSION, featureTour, firstRunFeatures } from './feature-tour';

const keys = new Set(Object.keys(messages));

describe('registro de features', () => {
  it('tem id único por feature — a persistência depende disso', () => {
    const ids = featureTour.map((feature) => feature.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('traduz título e corpo de toda feature', () => {
    for (const feature of featureTour) {
      expect(keys.has(feature.titleKey), feature.titleKey).toBe(true);
      expect(keys.has(feature.bodyKey), feature.bodyKey).toBe(true);
    }
  });

  it('usa glifo que a arte de capa sabe desenhar', () => {
    // Derivado dos caminhos reais: uma lista escrita à mão aqui sairia de
    // sincronia com a arte no primeiro glifo novo.
    const drawable = new Set<string>(Object.keys(coverGlyphPaths));
    for (const feature of featureTour) {
      expect(drawable.has(feature.glyph), feature.id + ': ' + feature.glyph).toBe(true);
    }
  });

  it('não registra a mesma rota em duas features', () => {
    const seen = new Map<string, string>();
    for (const feature of featureTour) {
      for (const route of feature.routes) {
        expect(seen.has(route), `${route} em ${seen.get(route)} e ${feature.id}`).toBe(false);
        seen.set(route, feature.id);
      }
    }
  });

  it('não dispensa uma rota que também está coberta', () => {
    const covered = new Set(featureTour.flatMap((feature) => feature.routes));
    for (const route of Object.keys(TOUR_EXEMPT_ROUTES)) {
      expect(covered.has(route), route).toBe(false);
    }
  });

  it('justifica toda dispensa — dispensa sem motivo vira lixo acumulado', () => {
    for (const [route, reason] of Object.entries(TOUR_EXEMPT_ROUTES)) {
      expect(reason.length, route).toBeGreaterThan(10);
    }
  });

  it('mantém o tour de primeiro acesso com tamanho apresentável', () => {
    // Acima disso ninguém termina; abaixo, não cobre o produto.
    expect(firstRunFeatures.length).toBeGreaterThanOrEqual(6);
    expect(firstRunFeatures.length).toBeLessThanOrEqual(12);
  });

  it('versiona o tour para poder reapresentá-lo', () => {
    expect(TOUR_VERSION).toBeGreaterThanOrEqual(1);
  });
});
