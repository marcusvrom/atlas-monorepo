import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { layout, spacing } from '@atlas/design-tokens';
import {
  Screen,
  ScreenHeader,
  IconButton,
  LoadingState,
  ErrorState,
  Text,
} from '../../design/components';
import { useMe } from '../../data/queries/identity';
import { useCheckIns } from '../../data/queries/check-ins';
import { localDayKey, shiftDay } from '../progress/dashboard-math';
import { CheckInForm } from './CheckInForm';
import { CheckInHistory } from './CheckInHistory';
import { t } from '../../i18n';
export function CheckInScreen() {
  const [now] = useState(() => new Date()),
    router = useRouter(),
    me = useMe();
  const date = localDayKey(now),
    query = useCheckIns(localDayKey(shiftDay(now, -6)), date);
  return (
    <Screen>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        <ScreenHeader
          title={t('checkInTitle')}
          subtitle={t('checkInSubtitle')}
          leading={<IconButton icon="back" label={t('back')} onPress={() => router.back()} />}
        />
        {me.isPending || query.isPending ? (
          <LoadingState />
        ) : me.isError || query.isError ? (
          <ErrorState
            message={t('checkInLoadError')}
            onRetry={() => {
              void me.refetch();
              void query.refetch();
            }}
          />
        ) : (
          <>
            <CheckInHistory
              entries={query.data}
              now={now}
              rehabilitation={me.data.goal?.type === 'rehabilitation'}
            />
            {!query.data.length ? <Text tone="secondary">{t('checkInNoHistoryHint')}</Text> : null}
            <CheckInForm
              date={date}
              initial={query.data.find((e) => e.date === date)}
              rehabilitation={me.data.goal?.type === 'rehabilitation'}
            />
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
const styles = StyleSheet.create({
  content: { padding: layout.pageInset, paddingBottom: spacing.huge, gap: layout.sectionGap },
});
