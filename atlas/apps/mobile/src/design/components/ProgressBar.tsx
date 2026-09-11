import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { radius, spacing } from '@atlas/design-tokens';
import { useTheme } from '../theme-provider';
export function ProgressBar({ value, label }: { value: number; label: string }) {
  const { colors } = useTheme();
  const progress = Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
  const styles = useMemo(
    () =>
      StyleSheet.create({
        track: {
          height: spacing.sm,
          borderRadius: radius.pill,
          backgroundColor: colors.borderStrong,
          overflow: 'hidden',
        },
        fill: {
          height: '100%',
          width: `${progress * 100}%`,
          backgroundColor: colors.brand,
          borderRadius: radius.pill,
        },
      }),
    [colors, progress],
  );
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}
      style={styles.track}
    >
      <View style={styles.fill} />
    </View>
  );
}
