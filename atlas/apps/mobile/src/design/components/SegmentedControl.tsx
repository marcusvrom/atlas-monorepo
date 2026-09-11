import { StyleSheet, View } from 'react-native';
import { spacing } from '@atlas/design-tokens';
import { Chip } from './Chip';
type Option = { value: string; label: string };
export function SegmentedControl({
  label,
  options,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  options: readonly [Option, Option, Option?];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <View accessibilityLabel={label} style={styles.root}>
      {options.map((option) =>
        option ? (
          <Chip
            key={option.value}
            label={option.label}
            selected={value === option.value}
            disabled={disabled}
            onPress={() => onChange(option.value)}
          />
        ) : null,
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  root: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
