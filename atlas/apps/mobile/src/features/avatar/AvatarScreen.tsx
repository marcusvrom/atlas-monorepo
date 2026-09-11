import { Screen, LoadingState, ErrorState } from '../../design/components';
import { t } from '../../i18n';
import { useMe } from './hooks';
import { AvatarEditor } from './AvatarEditor';
export function AvatarScreen() {
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
        <ErrorState message={t('profileError')} onRetry={() => void me.refetch()} />
      </Screen>
    );
  return (
    <Screen>
      <AvatarEditor initial={me.data.avatar} />
    </Screen>
  );
}
