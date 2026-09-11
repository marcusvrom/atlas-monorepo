import type { WorkoutPlanId } from '@atlas/contracts';
import { ScrollView, StyleSheet, View, Pressable } from 'react-native';
import { spacing } from '@atlas/design-tokens';
import { useRouter } from 'expo-router';
import { usePlan } from '../../data/queries/plans';
import { Card, Text, Icon, LoadingState, ErrorState, EmptyState } from '../../design/components';
import { t } from '../../i18n';
export function WeeklyPlan({ planId }: { planId: WorkoutPlanId }) {
  const plan = usePlan(planId),
    router = useRouter();
  return (
    <View style={styles.root}>
      <Text variant="title2" weight="bold">
        {t('dashboardPlanWeek')}
      </Text>
      <Text variant="footnote" tone="secondary">
        {t('dashboardPlanWeekHint')}
      </Text>
      {plan.isPending ? (
        <LoadingState />
      ) : plan.isError ? (
        <ErrorState message={t('planLoadError')} onRetry={() => void plan.refetch()} />
      ) : !plan.data.days.length ? (
        <EmptyState
          title={t('planEmptyDay')}
          description={t('planEmptyDayDescription')}
          actionLabel={t('edit')}
          onAction={() => router.push({ pathname: '/plan/[id]/edit', params: { id: planId } })}
        />
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.days}
        >
          {plan.data.days.slice(0, 7).map((day) => (
            <Pressable
              key={day.id}
              style={styles.day}
              accessibilityRole="button"
              accessibilityLabel={day.label}
              onPress={() =>
                router.push({
                  pathname: '/plan/[id]/day/[dayId]',
                  params: { id: planId, dayId: day.id },
                })
              }
            >
              <Card>
                <Text variant="caption" tone="brand" weight="bold">
                  {day.slot === null
                    ? t('dashboardUnscheduled')
                    : new Date(2026, 0, 4 + day.slot)
                        .toLocaleDateString('pt-BR', { weekday: 'short' })
                        .replace('.', '')
                        .toUpperCase()}
                </Text>
                <Text variant="title2" weight="bold">
                  {day.label}
                </Text>
                <Text variant="footnote" tone="secondary">
                  {day.estimatedMinutes} {t('minutesShort')} · {day.exercises.length}{' '}
                  {t('planExercises')}
                </Text>
                <Icon name="arrow" />
              </Card>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  root: { gap: spacing.md },
  days: { gap: spacing.md },
  day: { width: spacing.huge * 3 },
});
