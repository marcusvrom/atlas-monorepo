import type { CheckInEntry } from '@atlas/contracts';
import { StyleSheet, View } from 'react-native';
import { spacing } from '@atlas/design-tokens';
import { Text, ProgressBar } from '../../design/components';
import { localDayKey, shiftDay } from '../progress/dashboard-math';
import { ABSENT, formatDayMonth } from '../../lib/format';
import { t } from '../../i18n';
export function CheckInTrend({
  entries,
  now,
  field,
}: {
  entries: CheckInEntry[];
  now: Date;
  field: 'energy' | 'painLevel';
}) {
  const max = field === 'energy' ? 5 : 10;
  return (
    <View style={styles.root}>
      <Text weight="bold">{t(field === 'energy' ? 'checkInEnergyTrend' : 'checkInPainTrend')}</Text>
      {Array.from({ length: 7 }, (_, i) => {
        const date = shiftDay(now, i - 6),
          key = localDayKey(date);
        const entry = entries.find((e) => e.date === key && e.status === 'completed');
        const value = entry?.[field] ?? null;
        return (
          <View key={key} style={styles.row}>
            <Text variant="caption" tone="secondary" style={styles.date}>
              {formatDayMonth(date)}
            </Text>
            <View style={styles.bar}>
              <ProgressBar
                value={value === null ? 0 : value / max}
                label={value === null ? t('checkInMissing') : String(value) + ' / ' + max}
              />
            </View>
            <Text variant="caption" style={styles.value}>
              {value === null ? ABSENT : String(value) + '/' + max}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
const styles = StyleSheet.create({
  root: { gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  date: { width: spacing.xxl },
  bar: { flex: 1 },
  value: { width: spacing.xxl, textAlign: 'right' },
});
