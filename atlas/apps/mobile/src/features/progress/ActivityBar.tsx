import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { spacing, radius, glass } from '@atlas/design-tokens';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../design/theme-provider';
import { Text } from '../../design/components';
export function ActivityBar({
  value,
  max,
  label,
  selected,
  onPress,
}: {
  value: number;
  max: number;
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: { flex: 1, alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
        track: {
          height: spacing.huge * 2,
          width: '100%',
          justifyContent: 'flex-end',
          borderBottomWidth: glass.borderWidth,
          borderColor: colors.borderStrong,
        },
        bar: {
          height: Math.max(spacing.xs, max ? (value / max) * spacing.huge * 2 : 0),
          marginHorizontal: spacing.xs,
          borderRadius: radius.sm,
          opacity: selected ? 1 : 0.65,
        },
        label: { textAlign: 'center' },
      }),
    [colors, max, value, selected],
  );
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label + ': ' + value.toLocaleString('pt-BR')}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={styles.root}
    >
      <View style={styles.track}>
        <LinearGradient colors={[colors.brandPressed, colors.brand]} style={styles.bar} />
      </View>
      <Text variant="caption" tone={selected ? 'brand' : 'secondary'} style={styles.label}>
        {label}
      </Text>
    </Pressable>
  );
}
