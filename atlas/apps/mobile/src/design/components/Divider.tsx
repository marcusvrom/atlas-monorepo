import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { glass, spacing } from '@atlas/design-tokens';
import { useTheme } from '../theme-provider';
export function Divider() {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        line: {
          height: glass.borderWidth,
          backgroundColor: colors.borderStrong,
          marginVertical: spacing.sm,
        },
      }),
    [colors],
  );
  return <View accessible={false} style={styles.line} />;
}
