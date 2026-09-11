import { ActivityTimeline } from './ActivityTimeline';
import { WellbeingSection } from '../check-in/WellbeingSection';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { layout, spacing } from '@atlas/design-tokens';
import { useRouter } from 'expo-router';
import {
  Screen,
  ScreenHeader,
  LoadingState,
  ErrorState,
  EmptyState,
  SegmentedControl,
  Button,
} from '../../design/components';
import { t } from '../../i18n';
import { useMe } from './hooks';
import { useDashboardSessions } from '../../data/queries/dashboard';
import { progressOrder } from './progress-order';
import { CompositionSection } from './CompositionSection';
import { MuscleDistribution } from './MuscleDistribution';
import { StrengthSection } from './StrengthSection';
import { AdherenceSection } from './AdherenceSection';
import { DashboardOverview } from './DashboardOverview';
import { WeekCalendar } from './WeekCalendar';
export function ProgressScreen() {
  const me = useMe(),
    sessions = useDashboardSessions(),
    router = useRouter();
  const [days, setDays] = useState<7 | 30 | 90>(30),
    [now] = useState(() => new Date());
  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <ScreenHeader title={t('progress')} subtitle={t('dashboardDescription')} />
        <SegmentedControl
          label={t('dashboardPeriod')}
          value={String(days)}
          options={[
            { value: '7', label: t('period7') },
            { value: '30', label: t('period30') },
            { value: '90', label: t('period90') },
          ]}
          onChange={(v) => setDays(v === '7' ? 7 : v === '90' ? 90 : 30)}
        />
        {me.isPending || sessions.isPending ? (
          <LoadingState />
        ) : me.isError || sessions.isError ? (
          <ErrorState
            message={t('progressError')}
            onRetry={() => {
              void me.refetch();
              void sessions.refetch();
            }}
          />
        ) : (
          <>
            <DashboardOverview
              sessions={sessions.data}
              days={days}
              now={now}
              weeklyTarget={me.data.goal?.weeklySessionTarget ?? null}
            />
            {!sessions.data.some((s) => s.status === 'completed') ? (
              <EmptyState
                title={t('dashboardEmpty')}
                description={t('dashboardEmptyBody')}
                actionLabel={t('plans')}
                onAction={() => router.push('/(tabs)/plans')}
              />
            ) : null}
            <ActivityTimeline sessions={sessions.data} days={days} now={now} />
            <WeekCalendar sessions={sessions.data} now={now} />
            <Button
              label={t('dashboardHistory')}
              variant="ghost"
              onPress={() => router.push('/history')}
            />
            {progressOrder(me.data.goal?.type ?? 'generalHealth')
              .filter((section) => section !== 'rehabilitation')
              .map((section) => (
                <View key={section}>
                  {section === 'composition' ? (
                    <CompositionSection days={days} />
                  ) : section === 'volume' ? (
                    <MuscleDistribution days={days} />
                  ) : section === 'strength' ? (
                    <StrengthSection />
                  ) : (
                    <AdherenceSection days={days} />
                  )}
                </View>
              ))}
            <WellbeingSection rehabilitation={me.data.goal?.type === 'rehabilitation'} />
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
const styles = StyleSheet.create({
  content: { padding: layout.pageInset, paddingBottom: spacing.huge * 2, gap: layout.sectionGap },
});
