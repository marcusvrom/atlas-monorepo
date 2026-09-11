import type { SessionSummary } from '@atlas/contracts';
import { dayStart, shiftDay } from './dashboard-math';
export function activityBuckets(sessions: SessionSummary[], days: 7 | 30 | 90, now: Date) {
  const start = shiftDay(dayStart(now), 1 - days);
  return Array.from({ length: 7 }, (_, index) => {
    const from = shiftDay(start, Math.floor((index * days) / 7));
    const to = shiftDay(start, Math.floor(((index + 1) * days) / 7));
    const records = sessions.filter(
      (s) =>
        s.status === 'completed' &&
        Date.parse(s.startedAt) >= +from &&
        Date.parse(s.startedAt) < +to &&
        Date.parse(s.startedAt) <= +now,
    );
    return {
      from,
      to,
      records,
      volume: records.reduce((n, s) => n + s.totalVolumeKg, 0),
      minutes: Math.round(records.reduce((n, s) => n + s.durationSeconds, 0) / 60),
      sets: records.reduce((n, s) => n + s.setCount, 0),
    };
  });
}
