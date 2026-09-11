import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { glass, radius, spacing } from '@atlas/design-tokens';
import { Text } from '../design/components';
import { useTheme } from '../design/theme-provider';
import { t } from '../i18n';
import { describeIntensity, intensityColor } from './anatomy-scale';
export function AnatomyLegend() {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
        item: {
          padding: spacing.sm,
          borderRadius: radius.sm,
          borderWidth: glass.borderWidth,
          borderColor: colors.borderStrong,
        },
        none: { backgroundColor: intensityColor(0, colors.surface) },
        low: { backgroundColor: intensityColor(0.2, colors.surface) },
        medium: { backgroundColor: intensityColor(0.5, colors.surface) },
        high: { backgroundColor: intensityColor(1, colors.surface) },
      }),
    [colors],
  );
  return (
    <View accessibilityLabel={t('anatomyLegend')} style={styles.row}>
      {[0, 0.2, 0.5, 1].map((value, index) => (
        <View key={value} style={styles.item}>
          <View
            style={[styles.item, [styles.none, styles.low, styles.medium, styles.high][index]]}
          />
          <Text variant="caption">
            {index} · {describeIntensity(value)}
          </Text>
        </View>
      ))}
    </View>
  );
}
