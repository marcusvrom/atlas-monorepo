import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { OnboardingDraft } from '@atlas/contracts';
import { useApi } from '../api-provider';
import { readOnboarding, saveOnboarding } from '../onboarding-storage';
import { restoreOnboarding } from '../restore-onboarding';
import { queryKeys } from '../query-keys';
export function useOnboarding() {
  const api = useApi();
  const cache = useQueryClient();
  return useQuery({
    queryKey: ['onboarding'],
    queryFn: async () => {
      const draft = await readOnboarding();
      if (draft?.step === 'complete') {
        await restoreOnboarding(api, draft);
        await cache.invalidateQueries({ queryKey: queryKeys.me });
      }
      return draft;
    },
    staleTime: Infinity,
  });
}
export function useSaveOnboarding() {
  const api = useApi();
  const cache = useQueryClient();
  return useMutation({
    mutationFn: async (value: OnboardingDraft) => {
      const draft = OnboardingDraft.parse(value);
      if (draft.step === 'complete') {
        await restoreOnboarding(api, draft);
      }
      await saveOnboarding(draft);
      return draft;
    },
    onSuccess: async (draft) => {
      cache.setQueryData(['onboarding'], draft);
      await cache.invalidateQueries({ queryKey: queryKeys.me });
      await cache.invalidateQueries({ queryKey: queryKeys.programming.all });
    },
  });
}
