import { useRouter } from 'expo-router';
import { Button, Card, Text, ProgressBar, LoadingState, ErrorState } from '../../design/components';
import { useCheckIns } from '../../data/queries/check-ins';
import { useMe } from '../../data/queries/identity';
import { useCurrentDay } from '../../lib/use-current-day';
import { localDayKey } from '../progress/dashboard-math';
import { t } from '../../i18n';
export function DailyCheckInCard() {
  const now = useCurrentDay(),
    date = localDayKey(now),
    router = useRouter();
  const query = useCheckIns(date, date),
    me = useMe();
  const entry = query.data?.find((item) => item.date === date);
  const rehabilitation = me.data?.goal?.type === 'rehabilitation';
  const total = rehabilitation ? 4 : 3;
  const answered =
    Number(entry?.sleepHours != null) +
    Number(entry?.sleepQuality != null) +
    Number(entry?.energy != null) +
    Number(rehabilitation && entry?.painLevel != null);
  const completed = entry?.status === 'completed' && answered === total;
  return (
    <Card>
      <Text variant="footnote" tone="brand" weight="bold">
        {now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
      </Text>
      <Text variant="title2" weight="bold">
        {t('dailyTitle')}
      </Text>
      {query.isPending || me.isPending ? (
        <LoadingState />
      ) : query.isError || me.isError ? (
        <ErrorState
          message={t('checkInLoadError')}
          onRetry={() => {
            void query.refetch();
            void me.refetch();
          }}
        />
      ) : (
        <>
          <Text accessibilityLiveRegion="polite" weight="semibold">
            {t(completed ? 'dailyDone' : entry ? 'dailyDraft' : 'dailyEmpty')}
          </Text>
          <ProgressBar value={answered / total} label={t('checkInTitle')} />
          <Text variant="footnote" tone="secondary">
            {answered} / {total} {t('dailyAnswered')}
          </Text>
          <Text tone="secondary">{t(completed ? 'dailyDoneHint' : 'dailyHint')}</Text>
          <Button
            label={t(completed ? 'dailyReview' : entry ? 'checkInContinue' : 'checkInOpen')}
            variant={completed ? 'ghost' : 'solid'}
            onPress={() => router.push('/check-in')}
          />
        </>
      )}
      <Text variant="footnote" tone="secondary">
        {t('dailyWorkoutHint')}
      </Text>
    </Card>
  );
}
