import { describe, it, expect } from 'vitest';
import { SessionSummary } from '@atlas/contracts';
import { summarizePeriod, percentageChange, calendarWeek, localDayKey } from './dashboard-math';
function session(day: number, status = 'completed') {
  return SessionSummary.parse({
    id: crypto.randomUUID(),
    planId: null,
    planVersion: null,
    dayLabel: 'Treino',
    status,
    startedAt: new Date(2026, 8, day, 10).toISOString(),
    completedAt: status === 'completed' ? new Date(2026, 8, day, 11).toISOString() : null,
    totalVolumeKg: 100,
    durationSeconds: 3600,
    setCount: 3,
    exerciseCount: 1,
  });
}
describe('ATL-UI-012 indicadores', () => {
  it('compara períodos iguais e não duplica dias ativos', () => {
    const result = summarizePeriod(
      [session(10), session(10), session(9, 'abandoned'), session(2), session(11)],
      7,
      new Date(2026, 8, 10, 12),
    );
    expect(result.current).toEqual({
      sessions: 2,
      minutes: 120,
      volume: 200,
      sets: 6,
      activeDays: 1,
    });
    expect(result.previous.sessions).toBe(1);
  });
  it('não inventa porcentagem sem base anterior', () => {
    expect(percentageChange(10, 0)).toBeNull();
    expect(percentageChange(0, 10)).toBe(-100);
    expect(percentageChange(12, 10)).toBe(20);
  });
  it('calendário começa na segunda e cruza o mês usando dias locais', () => {
    const week = calendarWeek([], new Date(2026, 8, 1, 12));
    expect(localDayKey(week[0]!.date)).toBe('2026-08-31');
    expect(week[6]!.key).toBe('2026-09-06');
    expect(week.filter((d) => d.isToday)).toHaveLength(1);
  });
  it('soma todo o histórico recebido, incluindo mais de 50 sessões', () => {
    expect(
      summarizePeriod(
        Array.from({ length: 75 }, () => session(10)),
        30,
        new Date(2026, 8, 10, 12),
      ).current.sessions,
    ).toBe(75);
  });
  it('exclui sessão em andamento e respeita a virada do dia', () => {
    const now = new Date(2026, 8, 10, 0);
    expect(summarizePeriod([session(10, 'inProgress'), session(9)], 7, now).current.sessions).toBe(
      1,
    );
  });
});
