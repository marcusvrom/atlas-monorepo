import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { radius, spacing } from '@atlas/design-tokens';
import { useTheme } from '../theme-provider';
import { Text } from './Text';
export function Badge({
  label,
  tone = 'brand',
}: {
  label: string;
  tone?: 'brand' | 'success' | 'warning' | 'danger';
}) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          alignSelf: 'flex-start',
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xs,
          borderRadius: radius.sm,
          backgroundColor: colors.backgroundElevated,
        },
      }),
    [colors],
  );
  return (
    <View style={styles.root}>
      <Text variant="footnote" tone={tone} weight="semibold">
        {label}
      </Text>
    </View>
  );
}
