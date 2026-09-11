import { readOnboarding, saveOnboarding } from '../onboarding-storage';
import { CurrentGoal, ProfilePhoto, UpdateProfileInput, type Feature } from '@atlas/contracts';
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
      // O objetivo define o ajuste calórico da estimativa (ver
      // GOAL_ENERGY_ADJUSTMENT em @atlas/domain).
      void cache.invalidateQueries({ queryKey: queryKeys.nutrition.all });
    },
  });
}

export function useUpdateProfilePhoto() {
  const api = useApi(),
    cache = useQueryClient();
  return useMutation({
    mutationFn: (photoUri: ProfilePhoto) =>
      api.identity.updateProfilePhoto(ProfilePhoto.parse(photoUri)),
    onSuccess: () => cache.invalidateQueries({ queryKey: queryKeys.me }),
  });
}

/**
 * ATL-NUT-001 — edição dos dados básicos, incluindo as entradas da estimativa
 * metabólica. Invalida `nutrition` junto com `me`: mudar peso-alvo, sexo
 * biológico ou nível de atividade muda a meta calórica, e a tela de metas não
 * pode continuar mostrando o número anterior.
 */
export function useUpdateProfile() {
  const api = useApi(),
    cache = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateProfileInput) =>
      api.identity.updateProfile(UpdateProfileInput.parse(input)),
    onSuccess: () => {
      void cache.invalidateQueries({ queryKey: queryKeys.me });
      void cache.invalidateQueries({ queryKey: queryKeys.nutrition.all });
    },
  });
}
