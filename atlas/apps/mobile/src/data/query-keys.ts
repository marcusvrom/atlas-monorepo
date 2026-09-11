import type { ExerciseFilter, ExerciseId, MetricKey, WorkoutPlanId } from '@atlas/contracts';

/**
 * Chaves centralizadas. Invalidação errada é a fonte número um de bug de cache;
 * chaves espalhadas por arquivo garantem invalidação errada.
 */
export const queryKeys = {
  me: ['me'] as const,
  entitlements: ['me', 'entitlements'] as const,

  catalog: {
    all: ['catalog'] as const,
    exercises: (filter: ExerciseFilter) => ['catalog', 'exercises', filter] as const,
    exercise: (id: ExerciseId) => ['catalog', 'exercise', id] as const,
    muscleGroups: ['catalog', 'muscleGroups'] as const,
  },

  programming: {
    all: ['programming'] as const,
    today: ['programming', 'today'] as const,
    plans: (status?: string) => ['programming', 'plans', status ?? 'all'] as const,
    plan: (id: WorkoutPlanId) => ['programming', 'plan', id] as const,
  },

  session: {
    all: ['session'] as const,
    list: ['session', 'list'] as const,
    detail: (id: string) => ['session', 'detail', id] as const,
  },

  measurement: {
    all: ['measurement'] as const,
    list: ['measurement', 'list'] as const,
    series: (metric: MetricKey, from: string, to: string) =>
      ['measurement', 'series', metric, from, to] as const,
  },

  insights: {
    all: ['insights'] as const,
    muscleVolume: (periodDays: number) => ['insights', 'muscleVolume', periodDays] as const,
    adherence: (periodDays: number) => ['insights', 'adherence', periodDays] as const,
    progression: (exerciseId: ExerciseId) => ['insights', 'progression', exerciseId] as const,
  },

  coaching: {
    all: ['coaching'] as const,
    professionals: (filter: unknown) => ['coaching', 'professionals', filter] as const,
    clients: (sort?: string) => ['coaching', 'clients', sort ?? 'risk'] as const,
  },
} as const;
