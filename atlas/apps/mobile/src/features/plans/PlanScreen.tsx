import { useLocalSearchParams, useRouter } from 'expo-router';
import { WorkoutPlanId } from '@atlas/contracts';
import { FlashList } from '@shopify/flash-list';
import { StyleSheet, View } from 'react-native';
import { spacing } from '@atlas/design-tokens';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  GradientSurface,
  LoadingState,
  Screen,
  Text,
} from '../../design/components';
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
            <Button label={t('back')} variant="ghost" onPress={() => router.back()} />
            <GradientSurface name="slate" radius="xxl" level="lg" style={styles.hero}>
              <Text tone="onAccent" variant="title1" weight="bold">
                {value.name}
              </Text>
              <Text tone="onAccent" variant="subhead">
                {t(value.goal)} · {t('version')} {value.version}
              </Text>
            </GradientSurface>
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
            <Card>
              <Text variant="title3" weight="bold">
                {item.label}
              </Text>
              <Text tone="secondary">
                {item.exercises.length} {t('planExercises')}
              </Text>
              <Button
                label={t('edit')}
                variant="ghost"
                onPress={() =>
                  router.push({ pathname: '/plan/[id]/edit', params: { id: value.id } })
                }
              />
            </Card>
          </View>
        )}
      />
    </Screen>
  );
}
const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.huge },
  header: { gap: spacing.md },
  hero: { gap: spacing.xs },
  day: { paddingTop: spacing.md },
});
