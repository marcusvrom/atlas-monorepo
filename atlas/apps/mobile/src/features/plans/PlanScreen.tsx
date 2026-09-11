import { useLocalSearchParams, useRouter } from 'expo-router';
import { WorkoutPlanId } from '@atlas/contracts';
import { FlashList } from '@shopify/flash-list';
import { StyleSheet, View } from 'react-native';
import { layout, spacing } from '@atlas/design-tokens';
import {
  Button,
  CoverCard,
  CoverImage,
  EmptyState,
  ErrorState,
  IconButton,
  LoadingState,
  MetaChip,
  MetaChipRow,
  Screen,
  Text,
} from '../../design/components';
import { CoverScrim } from '../../design/media';
import { t } from '../../i18n';
import { usePlan, usePlanActions } from './hooks';
export function PlanScreen() {
  const params = useLocalSearchParams<{ id: string }>(),
    router = useRouter();
  const parsed = WorkoutPlanId.safeParse(params.id);
  const plan = usePlan(parsed.success ? parsed.data : undefined);
  const actions = usePlanActions();
  if (!parsed.success)
    return (
      <Screen>
        <ErrorState message={t('planLoadError')} />
      </Screen>
    );
  if (plan.isPending)
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  if (!plan.data)
    return (
      <Screen>
        <ErrorState message={t('planLoadError')} onRetry={() => void plan.refetch()} />
      </Screen>
    );
  const value = plan.data;
  return (
    <Screen>
      <FlashList
        data={value.days}
        keyExtractor={(day) => day.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.header}>
            {/* Mesma capa que identifica a ficha na lista — a cor faz a ponte
                entre as duas telas sem precisar de rótulo. */}
            <View>
              <CoverImage seed={value.id} glyph="barbell" radius="xxl" style={styles.hero}>
                <CoverScrim />
                <View style={styles.heroBody}>
                  <Text tone="onAccent" variant="caption" weight="bold">
                    {t('planCoverEyebrow')}
                  </Text>
                  <Text tone="onAccent" variant="title1" weight="bold">
                    {value.name}
                  </Text>
                  <MetaChipRow>
                    <MetaChip onCover icon="target" label={t(value.goal)} />
                    <MetaChip
                      onCover
                      icon="calendar"
                      label={
                        value.days.length +
                        ' ' +
                        t(value.days.length === 1 ? 'planDaySingular' : 'planDaysShort')
                      }
                    />
                    <MetaChip onCover icon="layers" label={t('version') + ' ' + value.version} />
                  </MetaChipRow>
                </View>
              </CoverImage>
              <View style={styles.heroBack}>
                <IconButton icon="back" label={t('back')} onPress={() => router.back()} />
              </View>
            </View>
            {value.status === 'draft' ? (
              <Button
                label={t('edit')}
                onPress={() =>
                  router.push({ pathname: '/plan/[id]/edit', params: { id: value.id } })
                }
              />
            ) : (
              <Button
                label={t('planRevise')}
                busy={actions.revise.isPending}
                onPress={() =>
                  actions.revise.mutate(value.id, {
                    onSuccess: (revision) =>
                      router.push({ pathname: '/plan/[id]/edit', params: { id: revision.id } }),
                  })
                }
              />
            )}
            {value.status === 'published' ? (
              <Button
                label={value.isActive ? t('planActive') : t('planActivate')}
                disabled={value.isActive}
                busy={actions.activate.isPending}
                onPress={() => actions.activate.mutate(value.id)}
              />
            ) : null}
            {actions.revise.isError || actions.activate.isError ? (
              <ErrorState message={t('planSaveError')} />
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title={t('planEmptyDay')}
            description={t('planEmptyDayDescription')}
            actionLabel={t('edit')}
            onAction={() => router.push({ pathname: '/plan/[id]/edit', params: { id: value.id } })}
          />
        }
        renderItem={({ item }) => (
          <View style={styles.day}>
            <CoverCard
              seed={item.id}
              glyph="dumbbell"
              height={layout.coverCard}
              title={item.label}
              meta={
                <MetaChipRow>
                  <MetaChip
                    onCover
                    icon="layers"
                    label={item.exercises.length + ' ' + t('planExercises')}
                  />
                  <MetaChip
                    onCover
                    icon="clock"
                    label={item.estimatedMinutes + ' ' + t('minutesShort')}
                  />
                </MetaChipRow>
              }
              onPress={() =>
                router.push({
                  pathname: '/plan/[id]/day/[dayId]',
                  params: { id: value.id, dayId: item.id },
                })
              }
            />
          </View>
        )}
      />
    </Screen>
  );
}
const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.huge },
  header: { gap: spacing.md },
  hero: { height: layout.coverHero },
  heroBody: { flex: 1, justifyContent: 'flex-end', padding: spacing.lg, gap: spacing.sm },
  heroBack: { position: 'absolute', top: spacing.md, left: spacing.md },
  day: { paddingTop: spacing.md },
});
