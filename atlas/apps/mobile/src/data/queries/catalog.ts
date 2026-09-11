import type { ExerciseFilter, ExerciseId } from '@atlas/contracts';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useApi } from '../api-provider';
import { queryKeys } from '../query-keys';

/** Catálogo é quase imutável: cache longo e agressivo é correto aqui. */
const CATALOG_STALE_TIME = 24 * 60 * 60_000;

export function useExercises(filter: ExerciseFilter) {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.catalog.exercises(filter),
    queryFn: () => api.catalog.listExercises(filter),
    staleTime: CATALOG_STALE_TIME,
  });
}

export function useExercise(id: ExerciseId | undefined) {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.catalog.exercise(id ?? ('none' as ExerciseId)),
    queryFn: () => api.catalog.getExercise(id!),
    enabled: id !== undefined,
    staleTime: CATALOG_STALE_TIME,
  });
}

export function useMuscleGroups() {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.catalog.muscleGroups,
    queryFn: () => api.catalog.listMuscleGroups(),
    staleTime: Infinity,
  });
}

export function useExercisePages(filter: Omit<ExerciseFilter, 'cursor'>) {
  const api = useApi();
  return useInfiniteQuery({
    queryKey: [...queryKeys.catalog.all, 'pages', filter],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => api.catalog.listExercises({ ...filter, cursor: pageParam }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: CATALOG_STALE_TIME,
  });
}
