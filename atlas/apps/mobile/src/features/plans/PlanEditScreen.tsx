import { WorkoutPlanId } from '@atlas/contracts';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button, ErrorState, LoadingState, Screen, Text } from '../../design/components';
import { t } from '../../i18n';
import { usePlan, usePlanActions } from './hooks';
import { PlanEditor } from './PlanEditor';
export function PlanEditScreen() {
  const params = useLocalSearchParams<{ id: string }>(),
    router = useRouter();
  const parsed = WorkoutPlanId.safeParse(params.id);
  const query = usePlan(parsed.success ? parsed.data : undefined);
  const { revise } = usePlanActions();
  if (!parsed.success)
    return (
      <Screen>
        <ErrorState message={t('planLoadError')} />
      </Screen>
    );
  if (query.isPending)
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  if (!query.data)
    return (
      <Screen>
        <ErrorState message={t('planLoadError')} onRetry={() => void query.refetch()} />
      </Screen>
    );
  const plan = query.data;
  if (plan.status !== 'draft')
    return (
      <Screen>
        <Text>{t('planRevisionRequired')}</Text>
        {revise.isError ? <ErrorState message={t('planSaveError')} /> : null}
        <Button
          label={t('planRevise')}
          busy={revise.isPending}
          onPress={() =>
            revise.mutate(plan.id, {
              onSuccess: (revision) =>
                router.replace({ pathname: '/plan/[id]/edit', params: { id: revision.id } }),
            })
          }
        />
        <Button label={t('back')} variant="ghost" onPress={() => router.back()} />
      </Screen>
    );
  return <PlanEditor key={plan.id} plan={plan} />;
}
