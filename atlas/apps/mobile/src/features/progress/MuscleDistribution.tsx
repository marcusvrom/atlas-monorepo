import { formatWeight } from '../../lib/format-weight';
import type { MuscleVolume } from '@atlas/contracts';
import { useState } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { spacing } from '@atlas/design-tokens';
import { useRouter } from 'expo-router';
import {
  Card,
  Text,
  Button,
  LoadingState,
  ErrorState,
  EmptyState,
  Sheet,
} from '../../design/components';
import { useMuscleVolume } from './hooks';
import { MuscleVolumeRow } from './MuscleVolumeRow';
import { VolumeSection } from './VolumeSection';
import { plural, t } from '../../i18n';
export function MuscleDistribution({ days }: { days: 7 | 30 | 90 }) {
  const query = useMuscleVolume(days),
    router = useRouter();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<MuscleVolume | null>(null);
  return (
    <Card>
      <Text variant="title2" weight="bold">
        {t('dashboardMuscles')}
      </Text>
      <Text tone="secondary" variant="footnote">
        {t('dashboardMusclesHint')}
      </Text>
      {query.isPending ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState message={t('progressError')} onRetry={() => void query.refetch()} />
      ) : !query.data.length ? (
        <EmptyState
          title={t('volumeEmpty')}
          description={t('volumeEmptyDescription')}
          actionLabel={t('plans')}
          onAction={() => router.push('/(tabs)/plans')}
        />
      ) : (
        <View style={styles.list}>
          <FlashList
            data={query.data}
            keyExtractor={(m) => m.muscleCode}
            renderItem={({ item }) => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={item.displayName}
                onPress={() => setSelected(item)}
              >
                <MuscleVolumeRow muscle={item} />
              </Pressable>
            )}
          />
        </View>
      )}
      <Sheet
        visible={selected !== null}
        title={selected?.displayName ?? t('muscleSelected')}
        onClose={() => setSelected(null)}
      >
        {selected ? (
          <View style={styles.details}>
            <Text variant="display" weight="bold">
              {formatWeight(selected.weightedVolumeKg)} {t('kilogramsShort')}
            </Text>
            <Text>
              {selected.effectiveSets}{' '}
              {plural(
                selected.effectiveSets,
                'dashboardEffectiveSetsOne',
                'dashboardEffectiveSets',
              )}
            </Text>
            <Text tone="secondary">{t('muscleEffectiveHint')}</Text>
            <Text tone="secondary">{t('muscleRelative')}</Text>
            <Text weight="bold">{Math.round(selected.intensity * 100)}%</Text>
          </View>
        ) : null}
      </Sheet>
      <Button variant="ghost" label={t('dashboardMuscleDetail')} onPress={() => setOpen(true)} />
      <Sheet visible={open} title={t('dashboardMuscleDetail')} onClose={() => setOpen(false)}>
        <VolumeSection periodDays={days} />
      </Sheet>
    </Card>
  );
}
const styles = StyleSheet.create({
  details: { gap: spacing.lg },
  list: { height: spacing.huge * 4 },
});
