import { useMemo, useState } from 'react';
import { ExerciseId } from '@atlas/contracts';
import { FlashList } from '@shopify/flash-list';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { spacing } from '@atlas/design-tokens';
import { AnatomicalModel } from '../../components/AnatomicalModel';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  GradientSurface,
  LoadingState,
  Screen,
  SegmentedControl,
  Sparkline,
  Text,
} from '../../design/components';
import { t } from '../../i18n';
import { useExercise, useExerciseProgression, useMuscleGroups } from './hooks';
import { equipmentLabel, difficultyLabel } from './labels';
import { ExerciseVideo } from './ExerciseVideo';
export function ExerciseDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const parsed = ExerciseId.safeParse(params.id);
  const id = parsed.success ? parsed.data : undefined;
  const exercise = useExercise(id),
    groups = useMuscleGroups(),
    progress = useExerciseProgression(id);
  const [view, setView] = useState<'anterior' | 'posterior'>('anterior');
  const activations = useMemo(
    () =>
      Object.fromEntries(
        exercise.data?.activations.map((a) => [a.muscleCode, a.activationWeight]) ?? [],
      ),
    [exercise.data],
  );
  const textRows = useMemo(
    () =>
      exercise.data
        ? [
            ...exercise.data.executionCues.map((text, index) => ({
              key: 'cue' + index,
              text,
              kind: 'cue',
            })),
            ...exercise.data.commonMistakes.map((text, index) => ({
              key: 'mistake' + index,
              text,
              kind: 'mistake',
            })),
          ]
        : [],
    [exercise.data],
  );
  if (!id)
    return (
      <Screen>
        <ErrorState message={t('catalogError')} />
        <Button label={t('back')} onPress={() => router.back()} />
      </Screen>
    );
  if (exercise.isPending)
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  if (!exercise.data)
    return (
      <Screen>
        <ErrorState message={t('catalogError')} onRetry={() => void exercise.refetch()} />
        <Button label={t('back')} onPress={() => router.back()} />
      </Screen>
    );
  const detail = exercise.data;
  return (
    <Screen>
      <FlashList
        data={textRows}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.group}>
            <Button label={t('back')} variant="ghost" onPress={() => router.back()} />
            <GradientSurface name="slate" radius="xxl" level="lg" style={styles.hero}>
              <Text tone="onAccent" variant="title1" weight="bold">
                {detail.name}
              </Text>
              <View style={styles.heroMeta}>
                <Text tone="onAccent" variant="subhead">
                  {equipmentLabel(detail.equipment)}
                </Text>
                <Badge
                  label={difficultyLabel(detail.difficulty)}
                  tone={
                    detail.difficulty === 'beginner'
                      ? 'success'
                      : detail.difficulty === 'intermediate'
                        ? 'warning'
                        : 'danger'
                  }
                />
              </View>
            </GradientSurface>
            {exercise.isError ? (
              <ErrorState message={t('catalogError')} onRetry={() => void exercise.refetch()} />
            ) : null}
            <ExerciseVideo
              media={detail.media.find((item) => item.kind === 'loop' || item.kind === 'video')}
            />
            <Card>
              <Text weight="bold">{t('catalogAnatomy')}</Text>
              <SegmentedControl
                label={t('catalogAnatomy')}
                options={[
                  { value: 'anterior', label: t('catalogAnterior') },
                  { value: 'posterior', label: t('catalogPosterior') },
                ]}
                value={view}
                onChange={(value) => setView(value === 'posterior' ? 'posterior' : 'anterior')}
              />
              {groups.isPending ? (
                <LoadingState lines={1} />
              ) : groups.isError ? (
                <ErrorState message={t('catalogError')} onRetry={() => void groups.refetch()} />
              ) : (
                <AnatomicalModel
                  mode="exercise"
                  exerciseActivations={detail.activations}
                  view={view}
                  activations={activations}
                  muscleGroups={groups.data ?? []}
                  width={spacing.huge * 3}
                />
              )}
            </Card>
            <Card>
              <Text weight="bold">{t('catalogHistory')}</Text>
              {progress.isPending ? (
                <LoadingState lines={1} />
              ) : progress.isError ? (
                <ErrorState message={t('catalogError')} onRetry={() => void progress.refetch()} />
              ) : progress.data?.points.length ? (
                <Sparkline
                  values={progress.data.points.map((point) => point.estimatedOneRepMaxKg)}
                  label={t('catalogHistory')}
                  emptyLabel={t('catalogNoHistory')}
                />
              ) : (
                <EmptyState
                  title={t('catalogHistory')}
                  description={t('catalogNoHistory')}
                  actionLabel={t('back')}
                  onAction={() => router.back()}
                />
              )}
            </Card>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.instruction}>
            <Text variant="footnote" tone={item.kind === 'cue' ? 'brand' : 'warning'}>
              {item.kind === 'cue' ? t('catalogCues') : t('catalogMistakes')}
            </Text>
            <Text>{item.text}</Text>
          </View>
        )}
      />
    </Screen>
  );
}
const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.huge },
  group: { gap: spacing.lg },
  hero: { gap: spacing.sm },
  heroMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  instruction: { paddingVertical: spacing.md, gap: spacing.xs },
});
