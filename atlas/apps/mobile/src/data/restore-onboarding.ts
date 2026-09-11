import type { ApiClient } from '@atlas/api-client';
import { OnboardingDraft } from '@atlas/contracts';

/**
 * Aplica o rascunho do primeiro acesso ao perfil real.
 *
 * A foto vai por último e de propósito: é o único passo que pode falhar por
 * motivo externo (permissão revogada, arquivo movido). Falhar aqui não pode
 * desfazer perfil, objetivo e medida, que já foram aceitos.
 */
export async function restoreOnboarding(api: ApiClient, value: OnboardingDraft) {
  const draft = OnboardingDraft.parse(value);
  await api.identity.updateProfile(draft.profile);
  if (draft.goal) await api.identity.updateGoal(draft.goal);
  if (draft.baseline) await api.measurement.record(draft.baseline);
  if (draft.photoUri) await api.identity.updateProfilePhoto(draft.photoUri);
  return draft;
}
