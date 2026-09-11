import { formatWorkoutVolume } from '../../lib/format';
import type { MuscleVolume } from '@atlas/contracts';
import { StyleSheet, View } from 'react-native';
import { spacing } from '@atlas/design-tokens';
import { ProgressBar, Text } from '../../design/components';
import { plural, t } from '../../i18n';
export function MuscleVolumeRow({ muscle }: { muscle: MuscleVolume }) {
  return (
    <View style={styles.root}>
      <View style={styles.row}>
        <Text weight="semibold" style={styles.name}>
          {muscle.displayName}
        </Text>
        <Text variant="subhead">
          {formatWorkoutVolume(muscle.weightedVolumeKg)} {t('kilogramsShort')}
        </Text>
      </View>
      <ProgressBar value={muscle.intensity} label={muscle.displayName} />
      <Text variant="footnote" tone="secondary">
        {muscle.effectiveSets}{' '}
        {plural(muscle.effectiveSets, 'dashboardEffectiveSetsOne', 'dashboardEffectiveSets')}
      </Text>
    </View>
  );
}
const styles = StyleSheet.create({
  root: { gap: spacing.sm, paddingBottom: spacing.lg },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  name: { flex: 1 },
});
