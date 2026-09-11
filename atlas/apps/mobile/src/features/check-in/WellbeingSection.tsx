import { useCurrentDay } from '../../lib/use-current-day';
import { useRouter } from 'expo-router';
import { Button, Card, Text, LoadingState, ErrorState, EmptyState } from '../../design/components';
import { useCheckIns } from '../../data/queries/check-ins';
import { shiftDay, localDayKey } from '../progress/dashboard-math';
import { CheckInHistory } from './CheckInHistory';
import { t } from '../../i18n';
export function WellbeingSection({ rehabilitation = false }: { rehabilitation?: boolean }) {
  const now = useCurrentDay(),
    router = useRouter(),
    query = useCheckIns(localDayKey(shiftDay(now, -6)), localDayKey(now));
  return query.isPending ? (
    <LoadingState />
  ) : query.isError ? (
    <ErrorState message={t('checkInLoadError')} onRetry={() => void query.refetch()} />
  ) : !query.data.length ? (
    <Card>
      <Text variant="title2" weight="bold">
        {t('dashboardCheckIn')}
      </Text>
      <EmptyState
        title={t('checkInNoHistory')}
        description={t('dashboardCheckInHint')}
        actionLabel={t('checkInOpen')}
        onAction={() => router.push('/check-in')}
      />
    </Card>
  ) : (
    <>
      <CheckInHistory entries={query.data} now={now} rehabilitation={rehabilitation} />
      <Button
        variant="ghost"
        label={t(
          query.data.find((e) => e.date === localDayKey(now))?.status === 'completed'
            ? 'dailyReview'
            : 'checkInContinue',
        )}
        onPress={() => router.push('/check-in')}
      />
    </>
  );
}
