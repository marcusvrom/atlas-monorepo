import { SessionId } from '@atlas/contracts';
import { useLocalSearchParams } from 'expo-router';
import { Screen, LoadingState, ErrorState } from '../../design/components';
import { t } from '../../i18n';
import { useSession } from './hooks';
import { WorkoutSession } from './WorkoutSession';
export function SessionScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const parsed = SessionId.safeParse(params.id);
  const session = useSession(parsed.success ? parsed.data : undefined);
  if (!parsed.success)
    return (
      <Screen>
        <ErrorState message={t('sessionLoadError')} />
      </Screen>
    );
  if (session.isPending)
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  if (!session.data)
    return (
      <Screen>
        <ErrorState message={t('sessionLoadError')} onRetry={() => void session.refetch()} />
      </Screen>
    );
  return <WorkoutSession session={session.data} />;
}
