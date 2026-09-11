import type { SessionSummary } from '@atlas/contracts';
export function localDayKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}
export function dayStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
export function shiftDay(date: Date, offset: number) {
  const next = dayStart(date);
  next.setDate(next.getDate() + offset);
  return next;
}
export function summarizePeriod(sessions: SessionSummary[], days: number, now: Date) {
  const end = shiftDay(now, 1),
    start = shiftDay(end, -days),
    previousStart = shiftDay(start, -days);
  const completed = sessions.filter(
    (s) => s.status === 'completed' && Date.parse(s.startedAt) <= now.getTime(),
  );
  const select = (from: Date, to: Date) =>
    completed.filter(
      (s) => Date.parse(s.startedAt) >= from.getTime() && Date.parse(s.startedAt) < to.getTime(),
    );
  const totals = (items: SessionSummary[]) => ({
    sessions: items.length,
    minutes: Math.round(items.reduce((n, s) => n + s.durationSeconds, 0) / 60),
    volume: items.reduce((n, s) => n + s.totalVolumeKg, 0),
    sets: items.reduce((n, s) => n + s.setCount, 0),
    activeDays: new Set(items.map((s) => localDayKey(new Date(s.startedAt)))).size,
  });
  const current = select(start, end),
    previous = select(previousStart, start);
  return { current: totals(current), previous: totals(previous), sessions: current, start, end };
}
export function percentageChange(current: number, previous: number) {
  return previous > 0 ? ((current - previous) / previous) * 100 : null;
}
export function calendarWeek(sessions: SessionSummary[], now: Date, offset = 0) {
  const start = shiftDay(now, -((now.getDay() + 6) % 7) + offset * 7);
  return Array.from({ length: 7 }, (_, index) => {
    const date = shiftDay(start, index);
    const key = localDayKey(date);
    const completed = sessions.filter(
      (s) => s.status === 'completed' && localDayKey(new Date(s.startedAt)) === key,
    );
    return {
      date,
      key,
      sessions: completed,
      isToday: key === localDayKey(now),
      isFuture: date > now,
    };
  });
}
