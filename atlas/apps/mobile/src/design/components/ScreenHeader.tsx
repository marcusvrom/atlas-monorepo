import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { spacing } from '@atlas/design-tokens';
import { Text } from './Text';
export function ScreenHeader({
  title,
  subtitle,
  leading,
  action,
}: {
  title: string;
  subtitle?: string;
  leading?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <View style={styles.root}>
      {leading}
      <View style={styles.copy}>
        <Text variant="title1" weight="bold" accessibilityRole="header">
          {title}
        </Text>
        {subtitle ? (
          <Text variant="subhead" tone="secondary">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {action}
    </View>
  );
}
const styles = StyleSheet.create({
  root: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  copy: { flex: 1, gap: spacing.xs },
});
