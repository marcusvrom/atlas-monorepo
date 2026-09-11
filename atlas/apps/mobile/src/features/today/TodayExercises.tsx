import type { TodayWorkout } from '@atlas/contracts';
import { StyleSheet, View } from 'react-native';
import { layout, spacing } from '@atlas/design-tokens';
import { useRouter } from 'expo-router';
import { Carousel, CoverCard, MetaChip, MetaChipRow, SectionHeader } from '../../design/components';
import { prescriptionSummary } from './prescription-summary';
import { t } from '../../i18n';

/**
 * Exercícios do dia, como trilho de cards de capa.
 *
 * Substitui a `FlashList` vertical de altura fixa que existia aqui. A lista
 * antiga tinha um problema estrutural, não só estético: a altura fixa cortava
 * o dia no meio em qualquer ficha com mais de quatro exercícios, e a rolagem
 * interna competia com a da tela. O trilho horizontal mostra a mesma amostra,
 * não aninha rolagem no mesmo eixo, e o dia completo continua a um toque de
 * distância pelo "ver tudo" — que é exatamente o padrão "Today's Workout /
 * view all" das referências.
 *
 * `.slice` é intencional: o trilho é uma vitrine de tamanho conhecido, não uma
 * lista. Coleção sem limite continua sendo lista vertical virtualizada.
 */
const RAIL_SIZE = 6;

export function TodayExercises({ workout }: { workout: TodayWorkout }) {
  const router = useRouter();
  const openDay = () =>
    router.push({
      pathname: '/plan/[id]/day/[dayId]',
      params: { id: workout.planId, dayId: workout.day.id },
    });

  if (!workout.day.exercises.length) return null;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <SectionHeader
          title={t('dashboardExercisesToday')}
          subtitle={t('todayExercisesHint')}
          actionLabel={t('seeAll')}
          onAction={openDay}
        />
      </View>
      <Carousel itemWidth={layout.carouselItem} label={t('dashboardExercisesToday')}>
        {workout.day.exercises.slice(0, RAIL_SIZE).map((exercise) => {
          const summary = prescriptionSummary(exercise);
          return (
            <CoverCard
              key={exercise.exerciseId + '-' + exercise.order}
              seed={exercise.exerciseId}
              uri={exercise.thumbnailUrl}
              height={layout.coverCard}
              style={styles.card}
              showPlay
              eyebrow={String(exercise.order).padStart(2, '0')}
              title={exercise.exerciseName}
              meta={
                <MetaChipRow>
                  <MetaChip onCover icon="layers" label={summary.sets} />
                  <MetaChip onCover icon="clock" label={summary.rest} />
                </MetaChipRow>
              }
              onPress={() =>
                router.push({ pathname: '/exercise/[id]', params: { id: exercise.exerciseId } })
              }
            />
          );
        })}
      </Carousel>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.md },
  header: { paddingHorizontal: layout.pageInset },
  card: { width: layout.carouselItem },
});
