import { useState, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { AnatomicalModel } from '../../components/AnatomicalModel';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  SegmentedControl,
  Text,
} from '../../design/components';
import { t } from '../../i18n';
import { useMuscleGroups, useMuscleVolume, useEntitlement } from './hooks';
export function VolumeSection({ periodDays }: { periodDays?: 7 | 30 | 90 }) {
  const router = useRouter();
  const [selectedDays, setDays] = useState<7 | 30 | 90>(7),
    [view, setView] = useState<'anterior' | 'posterior'>('anterior');
  const days = periodDays ?? selectedDays;
  const volume = useMuscleVolume(days),
    groups = useMuscleGroups(),
    entitlement = useEntitlement('interactiveAnatomy');
  const activations = useMemo(
    () => Object.fromEntries(volume.data?.map((row) => [row.muscleCode, row.intensity]) ?? []),
    [volume.data],
  );
  return (
    <Card>
      <Text variant="title2" weight="bold">
        {t('volumeTitle')}
      </Text>
      {!periodDays ? (
        <SegmentedControl
          label={t('progressPeriod')}
          value={String(days)}
          options={[
            { value: '7', label: t('period7') },
            { value: '30', label: t('period30') },
            { value: '90', label: t('period90') },
          ]}
          onChange={(value) => setDays(value === '90' ? 90 : value === '30' ? 30 : 7)}
        />
      ) : null}
      <SegmentedControl
        label={t('catalogAnatomy')}
        value={view}
        options={[
          { value: 'anterior', label: t('catalogAnterior') },
          { value: 'posterior', label: t('catalogPosterior') },
        ]}
        onChange={(value) => setView(value === 'posterior' ? 'posterior' : 'anterior')}
      />
      {volume.isPending || groups.isPending ? (
        <LoadingState />
      ) : volume.isError || groups.isError ? (
        <ErrorState
          message={t('progressError')}
          onRetry={() => {
            void volume.refetch();
            void groups.refetch();
          }}
        />
      ) : volume.data.length ? (
        <AnatomicalModel
          interactive={entitlement.allowed}
          view={view}
          activations={activations}
          volumes={volume.data}
          muscleGroups={groups.data}
          onMusclePress={() => {
            if (!entitlement.allowed)
              router.push({ pathname: '/paywall', params: { feature: 'interactiveAnatomy' } });
          }}
        />
      ) : (
        <EmptyState
          title={t('volumeEmpty')}
          description={t('volumeEmptyDescription')}
          actionLabel={t('plans')}
          onAction={() => router.push('/(tabs)/plans')}
        />
      )}
      <Button label={t('catalogTitle')} variant="ghost" onPress={() => router.push('/exercises')} />
    </Card>
  );
}
