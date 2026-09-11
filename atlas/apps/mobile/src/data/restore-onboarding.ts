import type { ApiClient } from '@atlas/api-client';
import { OnboardingDraft } from '@atlas/contracts';
export async function restoreOnboarding(api: ApiClient, value: OnboardingDraft) {
  const draft = OnboardingDraft.parse(value);
  await api.identity.updateProfile(draft.profile);
  if (draft.goal) await api.identity.updateGoal(draft.goal);
  if (draft.baseline) await api.measurement.record(draft.baseline);
  return draft;
}
