import {getOfflineStore} from '../../offline/database';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UpdatePlanInput, WorkoutPlanId } from '@atlas/contracts';
import { useApi } from '../api-provider';
import { queryKeys } from '../query-keys';
export function usePlanPages() {
  const api = useApi();
  return useInfiniteQuery({
    queryKey: [...queryKeys.programming.all, 'pages'],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => api.programming.listPlans({ cursor: pageParam, limit: 20 }),
    getNextPageParam: (page) => page.nextCursor ?? undefined,
  });
}
export function usePlan(id: WorkoutPlanId | undefined) {
  const api = useApi();
  return useQuery({
    queryKey: [...queryKeys.programming.all, 'plan', id],
    queryFn: async()=>{const store=await getOfflineStore();try{const plan=await api.programming.getPlan(id!);await store.cachePlan(plan);return plan;}catch(error){const cached=await store.cachedPlan(id!);if(cached)return cached;throw error;}},
    enabled: !!id,
  });
}
export function usePlanActions() {
  const api = useApi(),
    cache = useQueryClient();
  const refresh = () => cache.invalidateQueries({ queryKey: queryKeys.programming.all });
  const update = useMutation({
    mutationFn: ({ id, input }: { id: WorkoutPlanId; input: UpdatePlanInput }) =>
      api.programming.updatePlan(id, input),
    onSuccess: refresh,
  });
  const revise = useMutation({
    mutationFn: (id: WorkoutPlanId) => api.programming.revisePlan(id),
    onSuccess: refresh,
  });
  const publish = useMutation({
    mutationFn: (id: WorkoutPlanId) => api.programming.publishPlan(id),
    onSuccess: refresh,
  });
  const activate = useMutation({
    mutationFn: (id: WorkoutPlanId) => api.programming.activatePlan(id),
    onSuccess: refresh,
  });
  return { update, revise, publish, activate };
}
