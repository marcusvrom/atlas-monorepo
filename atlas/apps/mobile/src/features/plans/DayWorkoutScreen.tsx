import { useLocalSearchParams, useRouter } from 'expo-router';
import { WorkoutPlanId } from '@atlas/contracts';
import { FlashList } from '@shopify/flash-list';
import { StyleSheet, View } from 'react-native';
import { spacing, layout } from '@atlas/design-tokens';
import {
  Screen,
  ScreenHeader,
  IconButton,
  LoadingState,
  ErrorState,
  Button,
  Text,
  EmptyState,
} from '../../design/components';
import { usePlan } from './hooks';
import { useStartSession } from '../../data/queries/training';
import { PrescriptionRow } from '../today/PrescriptionRow';
import { newId } from '../../lib/id';
import { t } from '../../i18n';
export function DayWorkoutScreen() {
  const params = useLocalSearchParams<{ id: string; dayId: string }>(),
    router = useRouter();
  const id = WorkoutPlanId.safeParse(params.id),
    plan = usePlan(id.success ? id.data : undefined),
    start = useStartSession();
  const day = plan.data?.days.find((d) => d.id === params.dayId);
  return (
    <Screen>
      <View style={styles.header}>
        <ScreenHeader
          title={day?.label ?? t('dashboardDayOpen')}
          subtitle={plan.data?.name}
          leading={<IconButton icon="back" label={t('back')} onPress={() => router.back()} />}
        />
      </View>
      {!id.success ? (
        <ErrorState message={t('planLoadError')} />
      ) : plan.isPending ? (
        <LoadingState />
      ) : plan.isError ? (
        <ErrorState message={t('planLoadError')} onRetry={() => void plan.refetch()} />
      ) : !day ? (
        <ErrorState message={t('planEmptyDay')} />
      ) : (
        <FlashList
          data={day.exercises}
          keyExtractor={(e) => e.exerciseId + '-' + e.order}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <View style={styles.headerContent}>
              <Text tone="secondary">
                {day.estimatedMinutes} {t('minutesShort')} · {day.exercises.length}{' '}
                {t('planExercises')}
              </Text>
              <Button
                label={t('startWorkout')}
                busy={start.isPending}
                disabled={!day.exercises.length || plan.data.status !== 'published'}
                onPress={() =>
                  start.mutate(
                    { clientGeneratedId: newId(), planId: plan.data.id, dayId: day.id },
                    {
                      onSuccess: (s) =>
                        router.push({ pathname: '/session/[id]', params: { id: s.id } }),
                    },
                  )
                }
              />
              {start.isError ? <ErrorState message={t('startWorkoutError')} /> : null}
            </View>
          }
          ListEmptyComponent={
            <EmptyState
              title={t('planEmptyDay')}
              description={t('planEmptyDayDescription')}
              actionLabel={t('edit')}
              onAction={() =>
                router.push({ pathname: '/plan/[id]/edit', params: { id: plan.data.id } })
              }
            />
          }
          renderItem={({ item }) => (
            <PrescriptionRow
              exercise={item}
              onPress={() =>
                router.push({ pathname: '/exercise/[id]', params: { id: item.exerciseId } })
              }
            />
          )}
        />
      )}
    </Screen>
  );
}
const styles = StyleSheet.create({
  header: { padding: layout.pageInset },
  list: { paddingHorizontal: layout.pageInset, paddingBottom: spacing.huge },
  headerContent: { gap: spacing.lg, paddingBottom: spacing.lg },
});
