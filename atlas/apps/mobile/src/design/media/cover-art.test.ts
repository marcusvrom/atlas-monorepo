import { describe, expect, it } from 'vitest';
import { coverPalettes } from '@atlas/design-tokens';
import { composeCover, coverGlyphPaths, coverGlyphs, hashSeed, type CoverGlyph } from './cover-art';

describe('cover art', () => {
  it('keeps the same composition for the same seed', () => {
    expect(composeCover('exercise-agachamento')).toEqual(composeCover('exercise-agachamento'));
  });

  it('separates seeds that differ by a single character', () => {
    expect(hashSeed('plan-a')).not.toBe(hashSeed('plan-b'));
  });

  it('honours an explicit glyph without changing the palette', () => {
    const free = composeCover('seed-1');
    const forced = composeCover('seed-1', 'kettlebell');
    expect(forced.glyph).toBe('kettlebell');
    expect(forced.colors).toEqual(free.colors);
  });

  it('never leaves a light focus outside the canvas', () => {
    for (let i = 0; i < 200; i += 1) {
      for (const glow of composeCover('seed-' + i).glows) {
        expect(glow.cx).toBeGreaterThanOrEqual(0);
        expect(glow.cx).toBeLessThanOrEqual(1);
        expect(glow.cy).toBeGreaterThanOrEqual(0);
        expect(glow.cy).toBeLessThanOrEqual(1);
      }
    }
  });

  it('spreads seeds over every palette instead of favouring one', () => {
    const used = new Set(
      Array.from({ length: 300 }, (_, i) => composeCover('exercise-' + i).paletteName),
    );
    expect(used.size).toBe(coverPalettes.length);
  });

  it('survives an empty seed', () => {
    const composition = composeCover('');
    expect(composition.colors).toHaveLength(3);
    expect(coverGlyphs).toContain(composition.glyph);
  });

  it('has a drawable path for every glyph', () => {
    for (const glyph of coverGlyphs) {
      expect(coverGlyphPaths[glyph as CoverGlyph].length).toBeGreaterThan(0);
    }
  });
});
