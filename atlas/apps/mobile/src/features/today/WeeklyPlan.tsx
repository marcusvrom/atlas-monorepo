import type { WorkoutPlanId } from '@atlas/contracts';
import { StyleSheet, View } from 'react-native';
import { layout, spacing } from '@atlas/design-tokens';
import { useRouter } from 'expo-router';
import { usePlan } from '../../data/queries/plans';
import {
  Carousel,
  CoverCard,
  EmptyState,
  ErrorState,
  LoadingState,
  MetaChip,
  MetaChipRow,
  SectionHeader,
} from '../../design/components';
import { t } from '../../i18n';

/**
 * A semana da ficha ativa, como trilho de capas.
 *
 * Cada dia tem cor própria e estável — a capa é semeada pelo `day.id`, então o
 * "Push" é sempre o mesmo roxo e o "Legs" sempre o mesmo azul, em qualquer
 * tela que mostre aquele dia. É a mesma ideia das grades coloridas das
 * referências, só que a cor sai do dado em vez de ser escolhida à mão.
 */
export function WeeklyPlan({ planId }: { planId: WorkoutPlanId }) {
  const plan = usePlan(planId),
    router = useRouter();

  const weekday = (slot: number) =>
    new Date(2026, 0, 4 + slot)
      .toLocaleDateString('pt-BR', { weekday: 'short' })
      .replace('.', '')
      .toUpperCase();

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <SectionHeader title={t('dashboardPlanWeek')} subtitle={t('dashboardPlanWeekHint')} />
      </View>
      {plan.isPending ? (
        <View style={styles.header}>
          <LoadingState />
        </View>
      ) : plan.isError ? (
        <View style={styles.header}>
          <ErrorState message={t('planLoadError')} onRetry={() => void plan.refetch()} />
        </View>
      ) : !plan.data.days.length ? (
        <View style={styles.header}>
          <EmptyState
            title={t('planEmptyDay')}
            description={t('planEmptyDayDescription')}
            actionLabel={t('edit')}
            onAction={() => router.push({ pathname: '/plan/[id]/edit', params: { id: planId } })}
          />
        </View>
      ) : (
        <Carousel itemWidth={layout.carouselItem} label={t('dashboardPlanWeek')}>
          {plan.data.days.slice(0, 7).map((day) => (
            <CoverCard
              key={day.id}
              seed={day.id}
              glyph="barbell"
              height={layout.coverCard}
              style={styles.card}
              eyebrow={day.slot === null ? t('dashboardUnscheduled') : weekday(day.slot)}
              title={day.label}
              meta={
                <MetaChipRow>
                  <MetaChip
                    onCover
                    icon="clock"
                    label={day.estimatedMinutes + ' ' + t('minutesShort')}
                  />
                  <MetaChip
                    onCover
                    icon="layers"
                    label={day.exercises.length + ' ' + t('planExercises')}
                  />
                </MetaChipRow>
              }
              onPress={() =>
                router.push({
                  pathname: '/plan/[id]/day/[dayId]',
                  params: { id: planId, dayId: day.id },
                })
              }
            />
          ))}
        </Carousel>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.md },
  header: { paddingHorizontal: layout.pageInset },
  card: { width: layout.carouselItem },
});
