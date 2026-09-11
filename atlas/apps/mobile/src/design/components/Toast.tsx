import { useEffect, useMemo } from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { radius, spacing, zIndex } from '@atlas/design-tokens';
import { useTheme } from '../theme-provider';
import { t } from '../../i18n';
import { Text } from './Text';
import { Button } from './Button';
import { dismissToast, useToasts } from './toast-store';
export function Toast() {
  const item = useToasts()[0];
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          position: 'absolute',
          bottom: insets.bottom + spacing.xl,
          left: spacing.lg,
          right: spacing.lg,
          borderRadius: radius.lg,
          padding: spacing.lg,
          gap: spacing.sm,
          backgroundColor: colors.surface,
          zIndex: zIndex.toast,
        },
      }),
    [colors, insets.bottom],
  );
  useEffect(() => {
    if (!item) return;
    AccessibilityInfo.announceForAccessibility(item.message);
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const start = (duration: number) => {
      if (!cancelled) timer = setTimeout(() => dismissToast(item.id), duration);
    };
    if (AccessibilityInfo.getRecommendedTimeoutMillis) {
      void AccessibilityInfo.getRecommendedTimeoutMillis(5000).then(start, () => start(5000));
    } else start(5000);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [item]);
  if (!item) return null;
  // Entrada e saída por corte: também atende Reduzir Movimento.
  return (
    <View accessibilityLiveRegion="polite" style={styles.root}>
      <Text>{item.message}</Text>
      <Button variant="ghost" label={t('close')} onPress={() => dismissToast(item.id)} />
    </View>
  );
}
