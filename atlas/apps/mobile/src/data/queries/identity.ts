import { readOnboarding, saveOnboarding } from '../onboarding-storage';
import { CurrentGoal, AvatarConfig, type Feature } from '@atlas/contracts';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useApi } from '../api-provider';
import { queryKeys } from '../query-keys';

export function useMe() {
  const api = useApi();
  return useQuery({ queryKey: queryKeys.me, queryFn: () => api.identity.getMe() });
}

/**
 * Fonte da verdade do paywall no client. Nenhuma tela pergunta "o plano é Pro?".
 * Ver spec 00 §4.8.
 */
export function useEntitlement(feature: Feature) {
  const api = useApi();
  const query = useQuery({
    queryKey: queryKeys.entitlements,
    queryFn: () => api.identity.listEntitlements(),
    staleTime: 5 * 60_000,
  });

  const entitlement = query.data?.find((e) => e.feature === feature);
  const allowed =
    entitlement !== undefined &&
    (entitlement.limit === null || entitlement.used < entitlement.limit);

  return { ...query, entitlement, allowed };
}

export function useUpdateGoal() {
  const api = useApi(),
    cache = useQueryClient();
  return useMutation({
    mutationFn: async (goal: CurrentGoal) => {
      const result = await api.identity.updateGoal(CurrentGoal.parse(goal));
      const draft = await readOnboarding();
      if (draft) await saveOnboarding({ ...draft, goal });
      return result;
    },
    onSuccess: () => {
      void cache.invalidateQueries({ queryKey: queryKeys.me });
      void cache.invalidateQueries({ queryKey: queryKeys.insights.all });
      void cache.invalidateQueries({ queryKey: queryKeys.session.all });
      void cache.invalidateQueries({ queryKey: queryKeys.programming.today });
    },
  });
}

export function useUpdateAvatar() {
  const api = useApi(),
    cache = useQueryClient();
  return useMutation({
    mutationFn: (avatar: AvatarConfig) => api.identity.updateAvatar(AvatarConfig.parse(avatar)),
    onSuccess: () => cache.invalidateQueries({ queryKey: queryKeys.me }),
  });
}
