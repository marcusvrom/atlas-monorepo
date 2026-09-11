import { StyleSheet, View } from 'react-native';
import { spacing } from '@atlas/design-tokens';
import { Text } from './Text';
export function InlineMetric({
  value,
  label,
  inverse = false,
}: {
  value: string;
  label: string;
  inverse?: boolean;
}) {
  return (
    <View style={styles.root}>
      <Text variant="title2" weight="bold" tone={inverse ? 'onAccent' : 'primary'}>
        {value}
      </Text>
      <Text variant="footnote" tone={inverse ? 'onAccent' : 'secondary'}>
        {label}
      </Text>
    </View>
  );
}
const styles = StyleSheet.create({ root: { flexGrow: 1, flexShrink: 1, gap: spacing.xs } });
