import { describe, expect, it } from 'vitest';
import { formatWeight } from './format-weight';
describe('weight presentation', () => {
  it.each([
    [15, '15'],
    [15.24, '15'],
    [15.25, '15,5'],
    [15.74, '15,5'],
    [15.75, '16'],
    [15660.3, '15.660,5'],
    [-0.1, '0'],
    [-1.25, '-1,5'],
    [null, '—'],
    [undefined, '—'],
    [NaN, '—'],
    [Infinity, '—'],
  ])('formats %s as %s', (value, expected) => expect(formatWeight(value)).toBe(expected));
  it('does not modify measurement precision', () => {
    const measurement = { weight: 81.37 };
    formatWeight(measurement.weight);
    expect(measurement.weight).toBe(81.37);
  });
});
