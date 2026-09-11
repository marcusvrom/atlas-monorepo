import { afterEach, describe, expect, it } from 'vitest';
import { nextStep } from './numeric-step';
import { sparklinePath } from './sparkline-path';
import { dismissToast, getToasts, showToast } from './toast-store';
afterEach(() => {
  for (const item of getToasts()) dismissToast(item.id);
});
describe('numeric controls', () => {
  it('clamps boundaries and keeps decimal increments stable', () => {
    expect(nextStep(0.2, 0.1, 0, 2)).toBe(0.3);
    expect(nextStep(0, -1, 0, 2)).toBe(0);
    expect(nextStep(2, 1, 0, 2)).toBe(2);
  });
  it('does not propagate invalid values', () => expect(nextStep(2, NaN, 0, 5)).toBe(2));
});
describe('sparkline', () => {
  it('avoids invalid geometry for empty and constant series', () => {
    expect(sparklinePath([], 100, 40, 4)).toBe('');
    expect(sparklinePath([4, 4], 100, 40, 4)).toBe('M4 20 L96 20');
  });
});
it('dismisses the head without discarding queued toast messages', () => {
  const first = showToast('first');
  const second = showToast('second');
  dismissToast(first);
  expect(getToasts()).toEqual([{ id: second, message: 'second' }]);
});
