import { StyleSheet, View } from 'react-native';
import type { SessionSummary } from '@atlas/contracts';
import { spacing } from '@atlas/design-tokens';
import {
  GradientSurface,
  InlineMetric,
  MetricTile,
  ProgressBar,
  Text,
} from '../../design/components';
import { t } from '../../i18n';
import { summarizePeriod, percentageChange, calendarWeek } from './dashboard-math';
export function DashboardOverview({
  sessions,
  days,
  now,
  weeklyTarget,
}: {
  sessions: SessionSummary[];
  days: 7 | 30 | 90;
  now: Date;
  weeklyTarget: number | null;
}) {
  const summary = summarizePeriod(sessions, days, now);
  const current = summary.current,
    previous = summary.previous;
  const weekSessions = calendarWeek(sessions, now).reduce((n, d) => n + d.sessions.length, 0);
  const delta = (value: number, prior: number) => {
    const change = percentageChange(value, prior);
    return change === null
      ? t('dashboardNoComparison')
      : (change > 0 ? '+' : '') +
          change.toLocaleString('pt-BR', { maximumFractionDigits: 0 }) +
          '% ' +
          t('dashboardCompared');
  };
  return (
    <View style={styles.content}>
      <GradientSurface name="slate" level="none" style={styles.hero}>
        <Text tone="onAccent" variant="footnote" weight="bold">
          {t('dashboardGoal')}
        </Text>
        <Text tone="onAccent" variant="title1" weight="bold">
          {weeklyTarget === null
            ? t('dashboardNoTarget')
            : weekSessions + ' / ' + weeklyTarget + ' ' + t('dashboardSessions').toLowerCase()}
        </Text>
        {weeklyTarget !== null ? (
          <ProgressBar value={weekSessions / weeklyTarget} label={t('dashboardGoal')} />
        ) : null}
        <Text tone="onAccent" variant="footnote">
          {t('dashboardWeek')}
        </Text>
      </GradientSurface>
      <View style={styles.grid}>
        <View style={styles.tile}>
          <MetricTile
            label={t('dashboardSessions')}
            value={String(current.sessions)}
            delta={delta(current.sessions, previous.sessions)}
            accent="activity"
          />
        </View>
        <View style={styles.tile}>
          <MetricTile
            label={t('dashboardMinutes')}
            value={current.minutes.toLocaleString('pt-BR')}
            delta={delta(current.minutes, previous.minutes)}
            accent="primary"
          />
        </View>
        <View style={styles.tile}>
          <MetricTile
            label={t('dashboardVolume')}
            value={current.volume.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
            delta={delta(current.volume, previous.volume)}
            accent="strength"
          />
        </View>
        <View style={styles.tile}>
          <MetricTile
            label={t('dashboardSets')}
            value={String(current.sets)}
            delta={delta(current.sets, previous.sets)}
            accent="energy"
          />
        </View>
      </View>
      <InlineMetric value={current.activeDays + ' / ' + days} label={t('dashboardActiveDays')} />
      <Text variant="footnote" tone="secondary">
        {t('dashboardCompareHint')}
      </Text>
    </View>
  );
}
const styles = StyleSheet.create({
  content: { gap: spacing.lg },
  hero: { gap: spacing.md, padding: spacing.xl },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  tile: { flexBasis: '45%', flexGrow: 1, minWidth: spacing.huge * 2 },
});
