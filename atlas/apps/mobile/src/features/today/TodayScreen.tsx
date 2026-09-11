import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { layout, spacing, opacity } from '@atlas/design-tokens';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  GradientSurface,
  LoadingState,
  InlineMetric,
  ProgressRing,
  Screen,
  Text,
  Icon,
} from '../../design/components';
import { useTodayWorkout, useStartSession } from '../../data/queries/training';
import { useMe } from '../../data/queries/identity';
import { useAdherence } from '../../data/queries/progress';
import { Avatar } from '../avatar/Avatar';
import { WorkoutArtwork } from './WorkoutArtwork';
import { WeeklyPlan } from './WeeklyPlan';
import { TodayExercises } from './TodayExercises';
import { t } from '../../i18n';
import { newId } from '../../lib/id';
export function TodayScreen() {
  const router = useRouter(),
    me = useMe(),
    today = useTodayWorkout(),
    adherence = useAdherence(30),
    start = useStartSession();
  const hour = new Date().getHours();
  const begin = () => {
    const workout = today.data;
    if (!workout) return;
    if (workout.inProgressSessionId) {
      router.push({ pathname: '/session/[id]', params: { id: workout.inProgressSessionId } });
      return;
    }
    start.mutate(
      { clientGeneratedId: newId(), planId: workout.planId, dayId: workout.day.id },
      {
        onSuccess: (session) =>
          router.push({ pathname: '/session/[id]', params: { id: session.id } }),
      },
    );
  };
  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.greeting}>
            <Text tone="secondary" variant="subhead">
              {t(hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening')}
            </Text>
            {me.isPending ? (
              <LoadingState lines={1} />
            ) : me.isError ? (
              <ErrorState message={t('profileError')} onRetry={() => void me.refetch()} />
            ) : (
              <Text variant="title1" weight="bold">
                {me.data.displayName}
              </Text>
            )}
          </View>
          {me.data ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('avatarEdit')}
              onPress={() => router.push('/avatar/edit')}
              style={({ pressed }) => pressed && styles.pressed}
            >
              <Avatar config={me.data.avatar} size={spacing.xxxl} />
            </Pressable>
          ) : null}
        </View>
        {today.isPending ? (
          <LoadingState />
        ) : today.isError ? (
          <ErrorState message={t('todayError')} onRetry={() => void today.refetch()} />
        ) : today.data === null ? (
          <EmptyState
            title={t('todayEmpty')}
            description={t('planEmptyDescription')}
            actionLabel={t('newPlan')}
            onAction={() => router.push('/plan/new')}
          />
        ) : (
          <View style={styles.section}>
            <GradientSurface name="slate" radius="xl" level="none" style={styles.hero}>
              <Text tone="onAccent" variant="caption" weight="bold">
                {t('todayEyebrow')}
              </Text>
              <View style={styles.heroHeading}>
                <View style={styles.greeting}>
                  <Text tone="onAccent" variant="display" weight="bold">
                    {today.data.day.label}
                  </Text>
                  <Text tone="onAccent" variant="subhead">
                    {today.data.planName}
                  </Text>
                </View>
                <WorkoutArtwork />
              </View>
              <View style={styles.metrics}>
                <InlineMetric
                  inverse
                  value={String(today.data.day.exercises.length)}
                  label={t('planExercises')}
                />
                <InlineMetric
                  inverse
                  value={String(today.data.day.estimatedMinutes)}
                  label={t('minutesShort')}
                />
                <InlineMetric
                  inverse
                  value={today.data.estimatedVolumeKg.toLocaleString('pt-BR')}
                  label={t('kilogramsShort')}
                />
              </View>
              <Button
                testID="today-start"
                label={t(today.data.inProgressSessionId ? 'resumeWorkout' : 'startWorkout')}
                busy={start.isPending}
                onPress={begin}
              />
            </GradientSurface>
            {start.isError ? <ErrorState message={t('startWorkoutError')} /> : null}
            {today.data.day.exercises[0] ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('todayExercise')}
                onPress={() =>
                  router.push({
                    pathname: '/exercise/[id]',
                    params: { id: today.data!.day.exercises[0]!.exerciseId },
                  })
                }
                style={({ pressed }) => [styles.link, pressed && styles.pressed]}
              >
                <Text variant="subhead" tone="brand" style={styles.greeting}>
                  {t('todayExercise')}
                </Text>
                <Icon name="arrow" />
              </Pressable>
            ) : null}
          </View>
        )}
        <Button
          variant="ghost"
          label={t('dashboardCheckIn')}
          onPress={() => router.push('/check-in')}
        />
        {today.data ? <WeeklyPlan planId={today.data.planId} /> : null}
        {today.data ? <TodayExercises workout={today.data} /> : null}
        <View style={styles.section}>
          <View style={styles.header}>
            <Text variant="title2" weight="bold">
              {t('todayOverview')}
            </Text>
            <Text variant="footnote" tone="secondary">
              {t('todayOverviewHint')}
            </Text>
          </View>
          <Card>
            {adherence.isPending ? (
              <LoadingState />
            ) : adherence.isError ? (
              <ErrorState message={t('progressError')} onRetry={() => void adherence.refetch()} />
            ) : (
              <View style={styles.adherence}>
                <ProgressRing
                  value={adherence.data.rate}
                  label={t('adherenceTitle')}
                  accent="activity"
                  size={spacing.huge + spacing.xl}
                />
                <View style={styles.adherenceMeta}>
                  <InlineMetric
                    label={t('completedSessions')}
                    value={
                      adherence.data.completedSessions + ' / ' + adherence.data.plannedSessions
                    }
                  />
                  <InlineMetric
                    label={t('currentStreak')}
                    value={String(adherence.data.currentStreak)}
                  />
                </View>
              </View>
            )}
          </Card>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('catalogTitle')}
          onPress={() => router.push('/exercises')}
          style={({ pressed }) => pressed && styles.pressed}
        >
          <Card>
            <View style={styles.header}>
              <Icon name="dumbbell" />
              <View style={styles.greeting}>
                <Text weight="semibold">{t('todayExplore')}</Text>
                <Text variant="footnote" tone="secondary">
                  {t('todayExploreHint')}
                </Text>
              </View>
              <Icon name="arrow" />
            </View>
          </Card>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}
const styles = StyleSheet.create({
  content: { padding: layout.pageInset, paddingBottom: spacing.huge * 2, gap: layout.sectionGap },
  header: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  greeting: { flex: 1, gap: spacing.xs },
  section: { gap: spacing.md },
  hero: { gap: spacing.xl, padding: spacing.xl },
  heroHeading: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg },
  pressed: { opacity: opacity.pressed },
  link: { minHeight: spacing.xxxl, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  adherence: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.xl },
  adherenceMeta: { flex: 1, minWidth: spacing.huge * 2, gap: spacing.lg },
});
