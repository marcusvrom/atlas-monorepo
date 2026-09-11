import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import type { SessionSummary } from '@atlas/contracts';
import { spacing } from '@atlas/design-tokens';
import { useRouter } from 'expo-router';
import { Card, Text, IconButton, Sheet, EmptyState, Button } from '../../design/components';
import { calendarWeek } from './dashboard-math';
import { CalendarDay } from './CalendarDay';
import { t } from '../../i18n';
export function WeekCalendar({ sessions, now }: { sessions: SessionSummary[]; now: Date }) {
  const [offset, setOffset] = useState(0),
    [selected, setSelected] = useState<string | null>(null);
  const router = useRouter();
  const week = calendarWeek(sessions, now, offset);
  const day = week.find((d) => d.key === selected);
  return (
    <Card>
      <View style={styles.header}>
        <View style={styles.copy}>
          <Text variant="title2" weight="bold">
            {t('dashboardCalendar')}
          </Text>
          <Text tone="secondary" variant="footnote">
            {week[0]!.date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }) +
              ' — ' +
              week[6]!.date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
          </Text>
        </View>
        <IconButton
          icon="back"
          label={t('dashboardPreviousWeek')}
          onPress={() => setOffset(offset - 1)}
        />
        {offset < 0 ? (
          <IconButton
            icon="arrow"
            label={t('dashboardNextWeek')}
            onPress={() => setOffset(offset + 1)}
          />
        ) : null}
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.week}
      >
        {week.map((day) => (
          <CalendarDay key={day.key} day={day} onPress={() => setSelected(day.key)} />
        ))}
      </ScrollView>
      <Text variant="footnote" tone="secondary">
        {t('dashboardCalendarHint')}
      </Text>
      <Sheet
        visible={!!day}
        title={day?.date.toLocaleDateString('pt-BR') ?? t('dashboardDate')}
        onClose={() => setSelected(null)}
      >
        <View style={styles.details}>
          <FlashList
            data={day?.sessions ?? []}
            keyExtractor={(s) => s.id}
            ListEmptyComponent={
              <EmptyState
                title={t('dashboardNoSession')}
                description={t('dashboardNoSessionHint')}
                actionLabel={t('plans')}
                onAction={() => {
                  setSelected(null);
                  router.push('/(tabs)/plans');
                }}
              />
            }
            renderItem={({ item }) => (
              <Button
                variant="ghost"
                label={
                  item.dayLabel +
                  ' · ' +
                  Math.round(item.durationSeconds / 60) +
                  ' ' +
                  t('minutesShort')
                }
                onPress={() => {
                  setSelected(null);
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
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  copy: { flex: 1, gap: spacing.xs },
  week: { gap: spacing.sm },
  details: { height: spacing.huge * 4 },
});
