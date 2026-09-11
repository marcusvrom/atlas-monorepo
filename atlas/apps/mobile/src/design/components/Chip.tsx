import { useMemo } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { glass, radius, spacing } from '@atlas/design-tokens';
import { useTheme } from '../theme-provider';
import { Text } from './Text';
export function Chip({
  label,
  accessibilityRole = 'checkbox',
  selected = false,
  disabled = false,
  onPress,
}: {
  label: string;
  accessibilityRole?: 'checkbox' | 'radio';
  selected?: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        base: {
          minHeight: spacing.xxxl,
          minWidth: spacing.xxxl,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          borderRadius: radius.pill,
          borderWidth: glass.borderWidth,
          borderColor: colors.borderStrong,
          backgroundColor: colors.surface,
          justifyContent: 'center',
        },
        selected: { borderColor: colors.brand },
        pressed: { borderColor: colors.textPrimary },
      }),
    [colors],
  );
  return (
    <Pressable
      accessibilityRole={accessibilityRole}
      accessibilityLabel={label}
      accessibilityState={{ checked: selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.base, selected && styles.selected, pressed && styles.pressed]}
    >
      <Text
        tone={disabled ? 'secondary' : selected ? 'brand' : 'primary'}
        weight={selected ? 'bold' : 'regular'}
      >
        {label}
      </Text>
    </Pressable>
  );
}
