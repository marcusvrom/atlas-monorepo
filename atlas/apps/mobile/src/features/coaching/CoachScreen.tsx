import { Screen, ErrorState, LoadingState } from '../../design/components';
import { t } from '../../i18n';
import { useMe } from './hooks';
import { ClientPanel } from './ClientPanel';
import { MarketplaceScreen } from './MarketplaceScreen';
export function CoachScreen() {
  const me = useMe();
  if (me.isPending)
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  if (me.isError)
    return (
      <Screen>
        <ErrorState message={t('coachError')} onRetry={() => void me.refetch()} />
      </Screen>
    );
  return me.data.roles.includes('professional') ? <ClientPanel /> : <MarketplaceScreen />;
}
