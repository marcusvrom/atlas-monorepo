import { describe, expect, it } from 'vitest';
import type { SessionId, SessionSummary, TodayWorkout } from '@atlas/contracts';
import { AWAY_THRESHOLD_DAYS, homeHero, sessionsThisWeek } from './home-hero';

const NOW = new Date(2026, 8, 11, 9, 0, 0); // sexta, 11 set 2026

function daysBefore(days: number, hour = 18): string {
  const date = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() - days, hour);
  return date.toISOString();
}

function session(patch: Partial<SessionSummary> = {}): SessionSummary {
  const startedAt = patch.startedAt ?? daysBefore(1);
  return {
    id: ('session-' + startedAt) as SessionId,
    planId: null,
    planVersion: null,
    dayLabel: 'Treino A',
    status: 'completed',
    startedAt,
    completedAt: startedAt,
    totalVolumeKg: 5200,
    durationSeconds: 3300,
    setCount: 18,
    exerciseCount: 6,
    ...patch,
  };
}

function workout(patch: Partial<TodayWorkout> = {}): TodayWorkout {
  return {
    planId: 'plan-1',
    planName: 'Hipertrofia',
    day: { id: 'day-1', label: 'Peito e tríceps', estimatedMinutes: 55, exercises: [] },
    estimatedVolumeKg: 4800,
    lastPerformedAt: null,
    inProgressSessionId: null,
    ...patch,
  } as TodayWorkout;
}

describe('hero contextual da home', () => {
  it('prioriza retomar sobre qualquer outra chamada', () => {
    const model = homeHero({
      workout: workout({ inProgressSessionId: 'session-open' as SessionId }),
      sessions: [session({ startedAt: daysBefore(0, 8), completedAt: daysBefore(0, 8) })],
      now: NOW,
    });
    expect(model.kind).toBe('resume');
    expect(model.target).toEqual({
      route: 'resumeSession',
      sessionId: 'session-open' as SessionId,
    });
    expect(model.context).toBe('active-workout');
  });

  it('retoma a sessão aberta mesmo quando o treino do dia não a conhece', () => {
    const open = session({ id: 'aberta' as SessionId, status: 'inProgress', completedAt: null });
    const model = homeHero({ workout: null, sessions: [open], now: NOW });
    expect(model.target).toEqual({ route: 'resumeSession', sessionId: 'aberta' });
  });

  it('confirma o treino recém-concluído em vez de pedir outro', () => {
    const done = session({
      id: 'de-hoje' as SessionId,
      startedAt: daysBefore(0, 7),
      completedAt: daysBefore(0, 8),
    });
    const model = homeHero({ workout: workout(), sessions: [done], now: NOW });
    expect(model.kind).toBe('celebrate');
    expect(model.target).toEqual({ route: 'sessionSummary', sessionId: 'de-hoje' });
    expect(model.context).toBe('workout-completed');
  });

  it('oferece iniciar quando há treino do dia e o usuário está em ritmo', () => {
    const model = homeHero({ workout: workout(), sessions: [session()], now: NOW });
    expect(model.kind).toBe('start');
    expect(model.title).toBe('homeHeroStartTitle');
    expect(model.target).toEqual({ route: 'startWorkout' });
  });

  it('muda o tom — mas não a ação — para quem voltou depois de dias', () => {
    const model = homeHero({
      workout: workout(),
      sessions: [session({ startedAt: daysBefore(6), completedAt: daysBefore(6) })],
      now: NOW,
    });
    expect(model.kind).toBe('start');
    expect(model.title).toBe('homeHeroBackTitle');
    expect(model.target).toEqual({ route: 'startWorkout' });
    expect(model.daysAway).toBe(6);
  });

  it('convida a retomar com algo leve quando não há treino marcado e houve ausência', () => {
    const model = homeHero({
      workout: null,
      sessions: [session({ startedAt: daysBefore(5), completedAt: daysBefore(5) })],
      now: NOW,
    });
    expect(model.kind).toBe('welcomeBack');
    expect(model.target).toEqual({ route: 'catalog' });
    expect(model.context).toBe('welcome-back');
    expect(model.daysAway).toBe(5);
  });

  it('trata dia sem treino como descanso, não como falha', () => {
    const model = homeHero({
      workout: null,
      sessions: [session({ startedAt: daysBefore(1), completedAt: daysBefore(1) })],
      now: NOW,
    });
    expect(model.kind).toBe('weekSummary');
    expect(model.target).toEqual({ route: 'progress' });
    expect(model.context).toBe('progress-highlight');
  });

  it('leva a criar a primeira ficha quando não há plano nem histórico', () => {
    const model = homeHero({ workout: null, sessions: [], now: NOW });
    expect(model.kind).toBe('noPlan');
    expect(model.target).toEqual({ route: 'newPlan' });
    expect(model.context).toBe('empty-plan');
  });

  it('corta a ausência exatamente no limite declarado', () => {
    const atThreshold = homeHero({
      workout: null,
      sessions: [
        session({
          startedAt: daysBefore(AWAY_THRESHOLD_DAYS),
          completedAt: daysBefore(AWAY_THRESHOLD_DAYS),
        }),
      ],
      now: NOW,
    });
    const belowThreshold = homeHero({
      workout: null,
      sessions: [
        session({
          startedAt: daysBefore(AWAY_THRESHOLD_DAYS - 1),
          completedAt: daysBefore(AWAY_THRESHOLD_DAYS - 1),
        }),
      ],
      now: NOW,
    });
    expect(atThreshold.kind).toBe('welcomeBack');
    expect(belowThreshold.kind).toBe('weekSummary');
  });

  it('ignora sessões abandonadas ao medir a ausência', () => {
    const model = homeHero({
      workout: null,
      sessions: [
        session({
          id: 'abandonada' as SessionId,
          status: 'abandoned',
          startedAt: daysBefore(0),
          completedAt: null,
        }),
        session({ startedAt: daysBefore(9), completedAt: daysBefore(9) }),
      ],
      now: NOW,
    });
    expect(model.kind).toBe('welcomeBack');
    expect(model.daysAway).toBe(9);
  });

  it('cobre todos os estados sem deixar nenhum sem ação primária', () => {
    const scenarios = [
      homeHero({
        workout: workout({ inProgressSessionId: 'x' as SessionId }),
        sessions: [],
        now: NOW,
      }),
      homeHero({
        workout: workout(),
        sessions: [session({ startedAt: daysBefore(0), completedAt: daysBefore(0) })],
        now: NOW,
      }),
      homeHero({ workout: workout(), sessions: [], now: NOW }),
      homeHero({
        workout: null,
        sessions: [session({ startedAt: daysBefore(7), completedAt: daysBefore(7) })],
        now: NOW,
      }),
      homeHero({
        workout: null,
        sessions: [session({ startedAt: daysBefore(1), completedAt: daysBefore(1) })],
        now: NOW,
      }),
      homeHero({ workout: null, sessions: [], now: NOW }),
    ];
    expect(new Set(scenarios.map((model) => model.kind)).size).toBe(6);
    for (const model of scenarios) {
      expect(model.actionLabel.length).toBeGreaterThan(0);
      expect(model.target.route.length).toBeGreaterThan(0);
    }
  });
});

describe('resumo da semana', () => {
  it('conta apenas os treinos concluídos da semana corrente', () => {
    const sessions = [
      session({ startedAt: daysBefore(0), completedAt: daysBefore(0) }),
      session({ startedAt: daysBefore(2), completedAt: daysBefore(2) }),
      session({
        id: 'semana-passada' as SessionId,
        startedAt: daysBefore(8),
        completedAt: daysBefore(8),
      }),
      session({
        id: 'aberta' as SessionId,
        status: 'inProgress',
        startedAt: daysBefore(1),
        completedAt: null,
      }),
    ];
    expect(sessionsThisWeek(sessions, NOW)).toBe(2);
  });

  it('devolve zero sem histórico, em vez de quebrar', () => {
    expect(sessionsThisWeek([], NOW)).toBe(0);
  });
});
