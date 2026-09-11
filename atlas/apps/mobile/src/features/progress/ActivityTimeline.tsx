import { formatWeight } from '../../lib/format-weight';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import type { SessionSummary } from '@atlas/contracts';
import { spacing } from '@atlas/design-tokens';
import { Card, Text, SegmentedControl, Button, Sheet, EmptyState } from '../../design/components';
import { plural, t } from '../../i18n';
import { activityBuckets } from './activity-buckets';
import { shiftDay } from './dashboard-math';
import { ActivityBar } from './ActivityBar';
export function ActivityTimeline({
  sessions,
  days,
  now,
}: {
  sessions: SessionSummary[];
  days: 7 | 30 | 90;
  now: Date;
}) {
  const [metric, setMetric] = useState<'volume' | 'minutes' | 'sets'>('volume'),
    [selected, setSelected] = useState(6),
    [open, setOpen] = useState(false);
  const router = useRouter(),
    buckets = activityBuckets(sessions, days, now),
    bucket = buckets[selected]!,
    max = Math.max(0, ...buckets.map((b) => b[metric]));
  const date = (v: Date) => v.toLocaleDateString('pt-BR', { day: 'numeric', month: 'numeric' });
  const range = date(bucket.from) + ' — ' + date(shiftDay(bucket.to, -1));
  return (
    <Card>
      <Text variant="footnote" tone="brand" weight="bold">
        {t('activitySelected')}
      </Text>
      <Text variant="title2" weight="bold">
        {t('activityTitle')}
      </Text>
      <Text variant="footnote" tone="secondary">
        {t('activityHint')}
      </Text>
      <SegmentedControl
        label={t('activityTitle')}
        value={metric}
        options={[
          { value: 'volume', label: t('activityVolume') },
          { value: 'minutes', label: t('activityMinutes') },
          { value: 'sets', label: t('activitySets') },
        ]}
        onChange={(v) => setMetric(v === 'minutes' ? 'minutes' : v === 'sets' ? 'sets' : 'volume')}
      />
      <Text variant="display" weight="bold">
        {metric === 'volume' ? formatWeight(bucket.volume) : bucket[metric].toLocaleString('pt-BR')}
      </Text>
      <Text tone="secondary">
        {t(
          metric === 'volume'
            ? 'activityUnitVolume'
            : metric === 'minutes'
              ? 'activityUnitMinutes'
              : 'activityUnitSets',
        )}
      </Text>
      <View style={styles.chart}>
        {buckets.map((b, i) => (
          <ActivityBar
            key={i}
            value={b[metric]}
            valueLabel={
              (metric === 'volume' ? formatWeight(b.volume) : b[metric].toLocaleString('pt-BR')) +
              ' ' +
              t(
                metric === 'volume'
                  ? 'activityUnitVolume'
                  : metric === 'minutes'
                    ? 'activityUnitMinutes'
                    : 'activityUnitSets',
              )
            }
            max={max}
            label={date(b.from)}
            selected={i === selected}
            onPress={() => setSelected(i)}
          />
        ))}
      </View>
      <Text weight="semibold">{range}</Text>
      <Text tone="secondary" variant="footnote">
        {bucket.records.length}{' '}
        {plural(bucket.records.length, 'activitySessionCountOne', 'activitySessionCount')}
      </Text>
      <Button variant="ghost" label={t('dashboardHistory')} onPress={() => setOpen(true)} />
      <Sheet visible={open} title={range} onClose={() => setOpen(false)}>
        <View style={styles.list}>
          <FlashList
            data={bucket.records}
            keyExtractor={(s) => s.id}
            ListEmptyComponent={
              <EmptyState
                title={t('activityNoRecords')}
                description={t('dashboardNoSessionHint')}
              />
            }
            renderItem={({ item }) => (
              <Button
                variant="ghost"
                label={date(new Date(item.startedAt)) + ' · ' + item.dayLabel}
                onPress={() => {
                  setOpen(false);
                  router.push({ pathname: '/session/[id]', params: { id: item.id } });
                }}
              />
            )}
          />
        </View>
      </Sheet>
    </Card>
  );
}
const styles = StyleSheet.create({
  chart: { flexDirection: 'row', gap: spacing.xxs, alignItems: 'flex-end' },
  list: { height: spacing.huge * 4 },
});
