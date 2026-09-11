import { describe, it, expect } from 'vitest';
import { resolveCapability } from './resolve-capability';
describe('glass capability', () => {
  it.each(['native', 'blurFallback', 'solid'] as const)(
    'transparency preference overrides %s',
    (requested) => {
      expect(resolveCapability(requested, true, true)).toBe('solid');
    },
  );
  it('native only renders when both native APIs are available', () => {
    expect(resolveCapability('native', false, true)).toBe('native');
    expect(resolveCapability('native', false, false)).toBe('blurFallback');
  });
  it.each(['blurFallback', 'solid'] as const)(
    'forces %s even on supported devices',
    (requested) => {
      expect(resolveCapability(requested, false, true)).toBe(requested);
    },
  );
});
