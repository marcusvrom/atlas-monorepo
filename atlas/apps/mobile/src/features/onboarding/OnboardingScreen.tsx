import { Redirect } from 'expo-router';
import { ErrorState, LoadingState, Screen } from '../../design/components';
import { t } from '../../i18n';
import { useOnboarding } from './hooks';
import { OnboardingForm } from './OnboardingForm';
export function OnboardingScreen() {
  const draft = useOnboarding();
  if (draft.isPending)
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  if (draft.isError)
    return (
      <Screen>
        <ErrorState message={t('onboardingNetworkError')} onRetry={() => void draft.refetch()} />
      </Screen>
    );
  if (!draft.data) return <Redirect href="/(auth)/welcome" />;
  if (draft.data.step === 'complete') return <Redirect href="/(tabs)" />;
  return <OnboardingForm initial={draft.data} />;
}
