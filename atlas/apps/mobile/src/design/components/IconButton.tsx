import { useMemo } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { radius, spacing, opacity } from '@atlas/design-tokens';
import { useTheme } from '../theme-provider';
import { Icon, type IconName } from './Icon';
export function IconButton({
  icon,
  label,
  onPress,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        base: {
          minWidth: spacing.xxxl,
          minHeight: spacing.xxxl,
          borderRadius: radius.pill,
          backgroundColor: colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
        },
        pressed: { opacity: opacity.pressed },
      }),
    [colors],
  );
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.base, pressed && styles.pressed]}
    >
      <Icon name={icon} />
    </Pressable>
  );
}
