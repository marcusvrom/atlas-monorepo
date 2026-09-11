import { View, StyleSheet } from 'react-native';
import { spacing } from '@atlas/design-tokens';
import { Chip, Text } from '../../design/components';
import { t } from '../../i18n';
const labels = {
  quality: [
    'checkInQuality1',
    'checkInQuality2',
    'checkInQuality3',
    'checkInQuality4',
    'checkInQuality5',
  ],
  energy: [
    'checkInEnergy1',
    'checkInEnergy2',
    'checkInEnergy3',
    'checkInEnergy4',
    'checkInEnergy5',
  ],
} as const;
export function RatingChoices({
  value,
  onChange,
  kind,
}: {
  value: number | null;
  onChange: (value: number) => void;
  kind: 'quality' | 'energy';
}) {
  return (
    <View style={styles.root}>
      <Text weight="semibold">
        {t(kind === 'quality' ? 'checkInSleepQuality' : 'checkInEnergy')}
      </Text>
      <View style={styles.options}>
        {[1, 2, 3, 4, 5].map((score) => (
          <Chip
            key={score}
            label={score + ' · ' + t(labels[kind][score - 1]!)}
            selected={score === value}
            onPress={() => onChange(score)}
          />
        ))}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  root: { gap: spacing.md },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
