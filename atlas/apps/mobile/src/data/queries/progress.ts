import { useState } from 'react';
import type { ExerciseId, MetricKey } from '@atlas/contracts';
import { useQuery } from '@tanstack/react-query';
import { useApi } from '../api-provider';
import { queryKeys } from '../query-keys';

export function useMuscleVolume(periodDays: 7 | 30 | 90 = 7) {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.insights.muscleVolume(periodDays),
    queryFn: () => api.insights.getMuscleVolume({ periodDays }),
    staleTime: 5 * 60_000,
  });
}

export function useAdherence(periodDays: 7 | 30 | 90 = 30) {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.insights.adherence(periodDays),
    queryFn: () => api.insights.getAdherence({ periodDays }),
  });
}

export function useExerciseProgression(exerciseId: ExerciseId | undefined) {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.insights.progression(exerciseId ?? ('none' as ExerciseId)),
    queryFn: () => api.insights.getExerciseProgression(exerciseId!),
    enabled: exerciseId !== undefined,
  });
}

export function useMetricSeries(metric: MetricKey, days = 90) {
  const api = useApi();
  const [periodEnd] = useState(() => Date.now());
  const toIso = new Date(periodEnd).toISOString();
  const fromIso = new Date(periodEnd - days * 24 * 60 * 60 * 1000).toISOString();

  return useQuery({
    queryKey: queryKeys.measurement.series(metric, fromIso.slice(0, 10), toIso.slice(0, 10)),
    // ma7: peso diário cru é ruído. A UI plota o suavizado. Ver @atlas/domain.
    queryFn: () => api.measurement.getSeries({ metric, fromIso, toIso, smoothing: 'ma7' }),
  });
}
