import { it, expect } from 'vitest';
import { SessionSummary } from '@atlas/contracts';
import { activityBuckets } from './activity-buckets';
it('ATL-UI-012 cobre cada dia uma vez inclusive janelas não divisíveis por sete', () => {
  for (const days of [7, 30, 90] as const) {
    const now = new Date(2026, 8, 11, 12);
    const items = Array.from({ length: days }, (_, i) => {
      const d = new Date(2026, 8, 11 - i, 10);
      return SessionSummary.parse({
        id: crypto.randomUUID(),
        planId: null,
        planVersion: null,
        dayLabel: 'Teste',
        status: 'completed',
        startedAt: d.toISOString(),
        completedAt: d.toISOString(),
        durationSeconds: 60,
        totalVolumeKg: 10,
        setCount: 1,
        exerciseCount: 1,
      });
    });
    const b = activityBuckets(items, days, now);
    expect(b.flatMap((x) => x.records)).toHaveLength(days);
    expect(new Set(b.flatMap((x) => x.records.map((s) => s.id))).size).toBe(days);
    expect(b.reduce((n, x) => n + x.volume, 0)).toBe(days * 10);
  }
});
