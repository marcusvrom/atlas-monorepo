import { DailyCheckInCard } from '../check-in/DailyCheckInCard';
import { formatWeight } from '../../lib/format-weight';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { layout, spacing, opacity } from '@atlas/design-tokens';
import {
  Button,
  Card,
  CoverCard,
  EmptyState,
  ErrorState,
  LoadingState,
  InlineMetric,
  MetaChip,
  MetaChipRow,
  ProgressRing,
  Screen,
  SectionHeader,
  Text,
  Icon,
} from '../../design/components';
import { useTodayWorkout, useStartSession } from '../../data/queries/training';
import { useMe } from '../../data/queries/identity';
import { useAdherence } from '../../data/queries/progress';
import { Avatar } from '../avatar/Avatar';
import { HydrationCard } from '../nutrition/HydrationCard';
import { WeeklyPlan } from './WeeklyPlan';
import { TodayExercises } from './TodayExercises';
import { t } from '../../i18n';
import { newId } from '../../lib/id';
import homeWorkoutImage from '../../../assets/marketing/home-workout.webp';

/**
 * Home do atleta.
 *
 * A composição segue as referências de `ui-examples/`: saudação com avatar,
 * um **hero de capa** que responde "o que eu faço agora" sem rolagem, e só
 * então as seções de apoio. A ordem é uma aposta de produto — quem abre o app
 * na academia quer o botão de começar, não o resumo do mês — e por isso a
 * constância dos 30 dias ficou abaixo do treino, não acima.
 *
 * O CTA mora **dentro** do hero, sobre a capa, em vez de flutuar solto abaixo
 * dele: é o que faz o bloco ler como um cartaz do treino e não como um card
 * com um botão pendurado.
 */
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
        <View style={styles.page}>
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
              <CoverCard
                seed={today.data.day.id}
                asset={homeWorkoutImage}
                glyph="dumbbell"
                height={layout.coverHero}
                eyebrow={t('todayEyebrow')}
                title={today.data.day.label}
                subtitle={today.data.planName}
                meta={
                  <MetaChipRow>
                    <MetaChip
                      onCover
                      icon="layers"
                      label={today.data.day.exercises.length + ' ' + t('planExercises')}
                    />
                    <MetaChip
                      onCover
                      icon="clock"
                      label={today.data.day.estimatedMinutes + ' ' + t('minutesShort')}
                    />
                    <MetaChip
                      onCover
                      icon="bolt"
                      label={formatWeight(today.data.estimatedVolumeKg) + ' ' + t('kilogramsShort')}
                    />
                  </MetaChipRow>
                }
              />
              <Button
                testID="today-start"
                label={t(today.data.inProgressSessionId ? 'resumeWorkout' : 'startWorkout')}
                busy={start.isPending}
                onPress={begin}
              />
              {start.isError ? <ErrorState message={t('startWorkoutError')} /> : null}
            </View>
          )}
        </View>

        <View style={styles.page}>
          <DailyCheckInCard />
        </View>

        {today.data ? <TodayExercises workout={today.data} /> : null}
        {today.data ? <WeeklyPlan planId={today.data.planId} /> : null}

        <View style={styles.page}>
          <View style={styles.section}>
            <SectionHeader title={t('todayOverview')} subtitle={t('todayOverviewHint')} />
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

          {/* ATL-NUT-001 — hidratação e metas do dia entram na home: são as duas
              coisas que o healthapp trouxe e que se consultam várias vezes ao
              dia, não uma vez por semana. */}
          <HydrationCard />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('nutritionTitle')}
            onPress={() => router.push('/nutrition')}
            style={({ pressed }) => pressed && styles.pressed}
          >
            <Card>
              <View style={styles.header}>
                <Icon name="flame" />
                <View style={styles.greeting}>
                  <Text weight="semibold">{t('nutritionTitle')}</Text>
                  <Text variant="footnote" tone="secondary">
                    {t('nutritionSubtitle')}
                  </Text>
                </View>
                <Icon name="arrow" />
              </View>
            </Card>
          </Pressable>

          <Button
            variant="ghost"
            label={t('dashboardCheckIn')}
            onPress={() => router.push('/check-in')}
          />

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
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  // O recuo lateral vive nos blocos, não no ScrollView: os trilhos horizontais
  // precisam sangrar até a borda da tela para sinalizar que há mais para o lado.
  content: { paddingBottom: spacing.huge * 2, gap: layout.sectionGap },
  page: { paddingHorizontal: layout.pageInset, gap: layout.sectionGap },
  header: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  greeting: { flex: 1, gap: spacing.xs },
  section: { gap: spacing.md },
  pressed: { opacity: opacity.pressed },
  adherence: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.xl },
  adherenceMeta: { flex: 1, minWidth: spacing.huge * 2, gap: spacing.lg },
});
