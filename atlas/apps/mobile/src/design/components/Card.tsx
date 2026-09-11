import { useMemo, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { elevation, palette, glass, spacing, radius } from '@atlas/design-tokens';
import { useTheme } from '../theme-provider';
export function Card({
  children,
  style,
  level = 'none',
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  level?: keyof typeof elevation;
}) {
  const { colors } = useTheme();
  const shadow = elevation[level];
  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderWidth: glass.borderWidth,
          borderRadius: radius.lg,
          padding: spacing.xl,
          gap: spacing.md,
          shadowColor: palette.black,
          shadowOpacity: shadow.shadowOpacity,
          shadowRadius: shadow.shadowRadius,
          shadowOffset: { width: spacing.none, height: spacing.xs },
          elevation: shadow.elevation,
        },
      }),
    [colors, shadow],
  );
  return <View style={[styles.root, style]}>{children}</View>;
}
