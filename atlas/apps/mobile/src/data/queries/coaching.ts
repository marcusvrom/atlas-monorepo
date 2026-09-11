import type { ProfessionalSearchFilter, ClientDetail, ShareScope, UserId } from '@atlas/contracts';
import { useInfiniteQuery, useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useApi } from '../api-provider';
import { queryKeys } from '../query-keys';

export function useProfessionalSearch(filter: ProfessionalSearchFilter) {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.coaching.professionals(filter),
    queryFn: () => api.coaching.searchProfessionals(filter),
  });
}

/** Painel do coach: uma query, N alunos, ordenado por risco. Ver spec 00 §11.5. */
export function useClients(sort: 'risk' | 'name' | 'lastSession' = 'risk') {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.coaching.clients(sort),
    queryFn: () => api.coaching.listClients({ sort }),
    staleTime: 60_000,
  });
}

export function useProfessionalPages(filter: ProfessionalSearchFilter) {
  const api = useApi();
  return useInfiniteQuery({
    queryKey: [...queryKeys.coaching.all, 'pages', filter],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => api.coaching.searchProfessionals({ ...filter, cursor: pageParam }),
    getNextPageParam: (page) => page.nextCursor ?? undefined,
  });
}
export function useProfessional(id: UserId | undefined) {
  const api = useApi();
  return useQuery({
    queryKey: [...queryKeys.coaching.all, 'professional', id],
    queryFn: () => api.coaching.getProfessionalDetail(id!),
    enabled: !!id,
  });
}
export function useClientDetail(id: UserId | undefined) {
  const api = useApi();
  return useQuery({
    queryKey: [...queryKeys.coaching.all, 'client', id],
    queryFn: () => api.coaching.getClientDetail(id!),
    enabled: !!id,
  });
}
export function useUpdateShareScope(id: UserId) {
  const api = useApi(),
    cache = useQueryClient();
  return useMutation({
    mutationFn: ({ engagementId, scope }: { engagementId: string; scope: ShareScope }) =>
      api.coaching.updateShareScope(engagementId, scope),
    onMutate: ({ scope }) => {
      void cache.cancelQueries({ queryKey: [...queryKeys.coaching.all, 'client', id] });
      cache.setQueryData<ClientDetail>([...queryKeys.coaching.all, 'client', id], (current) => {
        if (!current) return current;
        const { sessions, measurements, ...rest } = current;
        return {
          ...rest,
          engagement: { ...current.engagement, scope },
          ...(scope.workouts && sessions ? { sessions } : {}),
          ...(scope.measurements && measurements ? { measurements } : {}),
        };
      });
    },
    onSuccess: () => cache.invalidateQueries({ queryKey: queryKeys.coaching.all }),
  });
}
