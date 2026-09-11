import { useMemo, useState } from 'react';
import { ExerciseId } from '@atlas/contracts';
import { FlashList } from '@shopify/flash-list';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { layout, spacing } from '@atlas/design-tokens';
import { AnatomicalModel } from '../../components/AnatomicalModel';
import {
  Button,
  Card,
  CoverImage,
  EmptyState,
  ErrorState,
  IconButton,
  LoadingState,
  MetaChip,
  MetaChipRow,
  Screen,
  SegmentedControl,
  Sparkline,
  Text,
} from '../../design/components';
import { CoverScrim } from '../../design/media';
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
            {/*
              Hero de capa em vez do bloco de gradiente da rodada anterior: o
              exercício passa a ter uma imagem de identidade, e o botão de voltar
              flutua sobre ela — o padrão de tela de detalhe das referências.
            */}
            <View style={styles.heroWrap}>
              <CoverImage
                seed={detail.id}
                uri={detail.thumbnailUrl}
                glyph="dumbbell"
                radius="xxl"
                style={styles.hero}
              >
                <CoverScrim />
                <View style={styles.heroBody}>
                  <Text tone="onAccent" variant="title1" weight="bold">
                    {detail.name}
                  </Text>
                  <MetaChipRow>
                    <MetaChip onCover icon="dumbbell" label={equipmentLabel(detail.equipment)} />
                    <MetaChip onCover icon="target" label={difficultyLabel(detail.difficulty)} />
                  </MetaChipRow>
                </View>
              </CoverImage>
              <View style={styles.heroBack}>
                <IconButton icon="back" label={t('back')} onPress={() => router.back()} />
              </View>
            </View>
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
  heroWrap: { justifyContent: 'flex-start' },
  hero: { height: layout.coverHero },
  heroBody: { flex: 1, justifyContent: 'flex-end', padding: spacing.lg, gap: spacing.sm },
  heroBack: { position: 'absolute', top: spacing.md, left: spacing.md },
  instruction: { paddingVertical: spacing.md, gap: spacing.xs },
});
