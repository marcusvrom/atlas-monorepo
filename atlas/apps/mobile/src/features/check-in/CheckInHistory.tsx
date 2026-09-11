import { CheckInTrend } from './CheckInTrend';
import type { CheckInEntry } from '@atlas/contracts';
import { ScrollView, StyleSheet, View } from 'react-native';
import { spacing } from '@atlas/design-tokens';
import { Card, Text, InlineMetric } from '../../design/components';
import { shiftDay, localDayKey } from '../progress/dashboard-math';
import { t } from '../../i18n';
export function CheckInHistory({
  entries,
  now,
  rehabilitation,
}: {
  entries: CheckInEntry[];
  now: Date;
  rehabilitation: boolean;
}) {
  const completed = entries.filter((e) => e.status === 'completed');
  const average = (field: 'sleepHours' | 'energy' | 'painLevel') => {
    const values = completed.map((e) => e[field]).filter((v): v is number => v !== null);
    return values.length
      ? (values.reduce((n, v) => n + v, 0) / values.length).toLocaleString('pt-BR', {
          maximumFractionDigits: 1,
        })
      : '—';
  };
  return (
    <Card>
      <Text variant="title2" weight="bold">
        {t('checkInHistory')}
      </Text>
      <Text variant="footnote" tone="secondary">
        {t('checkInAverages')}
      </Text>
      <View style={styles.metrics}>
        <InlineMetric
          value={average('sleepHours') + ' ' + t('checkInHoursUnit')}
          label={t('checkInSleepLabel')}
        />
        <InlineMetric value={average('energy') + ' / 5'} label={t('checkInEnergyLabel')} />
        {rehabilitation ? (
          <InlineMetric value={average('painLevel') + ' / 10'} label={t('checkInPainLabel')} />
        ) : null}
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.days}
      >
        {Array.from({ length: 7 }, (_, i) => {
          const date = shiftDay(now, i - 6),
            key = localDayKey(date),
            entry = entries.find((e) => e.date === key);
          return (
            <View key={key} style={styles.day}>
              <Text variant="caption" tone="secondary">
                {date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'numeric' })}
              </Text>
              <Text weight="bold" tone={entry?.status === 'completed' ? 'success' : 'secondary'}>
                {entry?.sleepHours?.toLocaleString('pt-BR') ?? '—'} {t('checkInHoursUnit')}
              </Text>
              <Text variant="caption" tone="secondary">
                {entry
                  ? t(entry.status === 'completed' ? 'checkInCompleted' : 'checkInDraftStatus')
                  : '—'}
              </Text>
            </View>
          );
        })}
      </ScrollView>
      {completed.length ? <CheckInTrend entries={entries} now={now} field="energy" /> : null}
      {rehabilitation && completed.some((e) => e.painLevel !== null) ? (
        <CheckInTrend entries={entries} now={now} field="painLevel" />
      ) : null}
      <Text variant="footnote" tone="secondary">
        {t('checkInSelfReport')}
      </Text>
    </Card>
  );
}
const styles = StyleSheet.create({
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg },
  days: { gap: spacing.md },
  day: { minWidth: spacing.huge, gap: spacing.sm, paddingVertical: spacing.md },
});
