import { Pressable, StyleSheet } from 'react-native';
import { spacing, radius } from '@atlas/design-tokens';
import { Text } from '../design/components';

export function DemoOption({
  label,
  selected = false,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={styles.option}
    >
      <Text weight={selected ? 'bold' : 'regular'} tone={selected ? 'brand' : 'primary'}>
        {label}
      </Text>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  option: {
    minHeight: spacing.xxxl,
    padding: spacing.md,
    borderRadius: radius.md,
    justifyContent: 'center',
  },
});
