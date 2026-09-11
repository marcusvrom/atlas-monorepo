import { formatBodyMeasurement, formatDate, formatPercentage } from '../../lib/format';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { UserId } from '@atlas/contracts';
import { FlashList } from '@shopify/flash-list';
import { StyleSheet, View } from 'react-native';
import { spacing } from '@atlas/design-tokens';
import {
  Button,
  ErrorState,
  GradientSurface,
  LoadingState,
  MetricTile,
  Screen,
  Text,
} from '../../design/components';
import { t } from '../../i18n';
import { useClientDetail } from './hooks';
import { ShareScopeControls } from './ShareScopeControls';
export function ClientScreen() {
  const params = useLocalSearchParams<{ id: string }>(),
    router = useRouter();
  const parsed = UserId.safeParse(params.id);
  const query = useClientDetail(parsed.success ? parsed.data : undefined);
  if (!parsed.success)
    return (
      <Screen>
        <ErrorState message={t('coachError')} />
      </Screen>
    );
  if (query.isPending)
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  if (!query.data)
    return (
      <Screen>
        <ErrorState message={t('coachError')} onRetry={() => void query.refetch()} />
      </Screen>
    );
  const detail = query.data;
  const scope = detail.engagement.scope;
  const rows = [
    ...detail.notes.map((text, index) => ({ id: 'note-' + index, label: t('coachNotes'), text })),
    ...(scope.workouts
      ? (detail.sessions?.map((session) => ({
          id: session.id,
          label: t('recentSessions'),
          text: session.dayLabel + ' · ' + formatDate(session.startedAt),
        })) ?? [])
      : []),
    ...(scope.measurements
      ? (detail.measurements?.map((entry) => ({
          id: entry.id,
          label: t('clientMeasurements'),
          text: formatDate(entry.takenAt) + ' · ' + formatBodyMeasurement(entry.weightKg) + ' kg',
        })) ?? [])
      : []),
  ];
  return (
    <Screen>
      <FlashList
        data={rows}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.header}>
            <Button label={t('back')} variant="ghost" onPress={() => router.back()} />
            <GradientSurface name="slate" radius="xxl" level="lg" style={styles.hero}>
              <Text tone="onAccent" variant="title1" weight="bold">
                {detail.overview.displayName}
              </Text>
              <Text tone="onAccent" variant="subhead">
                {t(detail.goal.type)} · {detail.goal.weeklySessionTarget} {t('weeklySessions')}
              </Text>
            </GradientSurface>
            {scope.workouts ? (
              <View style={styles.metrics}>
                <MetricTile
                  label={t('adherenceTitle')}
                  value={formatPercentage(detail.overview.adherence30d)}
                  accent="activity"
                />
                <MetricTile
                  label={t('goalsNeedReview')}
                  value={String(detail.overview.goalsAtRisk)}
                  accent="energy"
                />
              </View>
            ) : null}
            {scope.measurements ? (
              <View style={styles.metrics}>
                <MetricTile
                  label={t('clientMeasurementChange')}
                  value={formatBodyMeasurement(detail.overview.weightDelta30dKg) + ' kg'}
                  accent="strength"
                />
                <MetricTile
                  label={t('leanMassLabel')}
                  value={formatBodyMeasurement(detail.overview.leanMassDelta30dKg) + ' kg'}
                  accent="primary"
                />
              </View>
            ) : null}
            {__DEV__ ? <ShareScopeControls detail={detail} /> : null}
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text weight="bold">{item.label}</Text>
            <Text>{item.text}</Text>
          </View>
        )}
      />
    </Screen>
  );
}
const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.huge },
  header: { gap: spacing.md },
  hero: { gap: spacing.xs },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  row: { paddingTop: spacing.md, gap: spacing.xs },
});
