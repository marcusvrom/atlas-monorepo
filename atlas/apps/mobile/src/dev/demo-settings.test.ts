import { afterEach, expect, it, vi } from 'vitest';
import { getDemoSettings, subscribeDemoSettings, updateDemoSettings } from './demo-settings';
afterEach(() => vi.unstubAllGlobals());
it('updates subscribers synchronously and rejects invalid controls', () => {
  vi.stubGlobal('__DEV__', true);
  const notify = vi.fn();
  const unsubscribe = subscribeDemoSettings(notify);
  updateDemoSettings({ latencyMs: 3000, errorRate: 1, capability: 'solid', theme: 'light' });
  expect(notify).toHaveBeenCalledOnce();
  expect(getDemoSettings()).toMatchObject({
    latencyMs: 3000,
    errorRate: 1,
    capability: 'solid',
    theme: 'light',
  });
  updateDemoSettings({ errorRate: 2 });
  updateDemoSettings({ latencyMs: NaN });
  expect(notify).toHaveBeenCalledOnce();
  unsubscribe();
  updateDemoSettings({ latencyMs: 0 });
  expect(notify).toHaveBeenCalledOnce();
});
it('cannot change controls in production', () => {
  vi.stubGlobal('__DEV__', false);
  const original = getDemoSettings();
  updateDemoSettings({ theme: 'dark', errorRate: 0 });
  expect(getDemoSettings()).toBe(original);
});
