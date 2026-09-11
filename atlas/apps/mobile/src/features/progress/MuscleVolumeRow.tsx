import { formatEffort, formatPercentage, formatTonnage } from '../../lib/format';
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
        {/* O número de cabeceira é a participação relativa, que é o que a
            barra ao lado desenha e o que a seção promete responder ("onde meu
            treino se concentrou"). Séries efetivas **não** servem aqui: elas
            contam só o músculo principal, então um sinergista aparece com "0
            séries efetivas" ao lado de 25 t de carga — verdadeiro, mas ilegível
            como manchete. As duas medidas ficam juntas, abaixo. */}
        <Text variant="subhead" weight="semibold">
          {formatPercentage(muscle.intensity)}
        </Text>
      </View>
      <ProgressBar value={muscle.intensity} label={muscle.displayName} />
      <Text variant="footnote" tone="secondary">
        {formatEffort(muscle.effectiveSets)}{' '}
        {plural(muscle.effectiveSets, 'dashboardEffectiveSetsOne', 'dashboardEffectiveSets')} ·{' '}
        {t('tonnageChip').replace('{value}', formatTonnage(muscle.weightedVolumeKg))}
      </Text>
    </View>
  );
}
const styles = StyleSheet.create({
  root: { gap: spacing.sm, paddingBottom: spacing.lg },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  name: { flex: 1 },
});
