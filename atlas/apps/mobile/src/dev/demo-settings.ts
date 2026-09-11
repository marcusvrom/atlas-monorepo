import { useSyncExternalStore } from 'react';
import type { ThemeName } from '@atlas/design-tokens';

export type DemoCapability = 'native' | 'blurFallback' | 'solid';
type DemoSettings = {
  highContrast:boolean;
  reduceMotion:boolean;
  reduceTransparency:boolean;
  plan: 'free' | 'pro';
  role: 'athlete' | 'professional';
  clientCount: 24 | 60;
  theme: ThemeName;
  capability: DemoCapability;
  latencyMs: number;
  errorRate: number;
};
function bounded(value: string | undefined, fallback: number, maximum: number): number {
  const parsed = value === undefined ? fallback : Number(value);
  return Number.isFinite(parsed) ? Math.min(maximum, Math.max(0, parsed)) : fallback;
}
let settings: DemoSettings = {
  highContrast:false,reduceMotion:false,reduceTransparency:false,
  plan: 'free',
  role: 'athlete',
  clientCount: 24,
  theme: 'dark',
  capability: 'native',
  latencyMs: bounded(process.env.EXPO_PUBLIC_MOCK_LATENCY_MS, 220, 30000),
  errorRate: bounded(process.env.EXPO_PUBLIC_MOCK_ERROR_RATE, 0, 1),
};
const listeners = new Set<() => void>();
export function getDemoSettings() {
  return settings;
}
export function subscribeDemoSettings(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
export function updateDemoSettings(patch: Partial<DemoSettings>) {
  if (!__DEV__) return;
  const next = { ...settings, ...patch };
  if (!Number.isFinite(next.latencyMs) || next.latencyMs < 0 || next.latencyMs > 30000) return;
  if (!Number.isFinite(next.errorRate) || next.errorRate < 0 || next.errorRate > 1) return;
  settings = next;
  listeners.forEach((listener) => listener());
}
export function useDemoSettings() {
  return useSyncExternalStore(subscribeDemoSettings, getDemoSettings, getDemoSettings);
}
