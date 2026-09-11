import { useAccessibilityPreferences } from '../accessibility';
import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';
import { scheduleOnUI } from 'react-native-worklets';
import { motion, radius, spacing } from '@atlas/design-tokens';
import { useTheme } from '../theme-provider';
import { t } from '../../i18n';
export function LoadingState({ lines = 3 }: { lines?: number }) {
  const { colors } = useTheme();
  const reduced = useAccessibilityPreferences().reduceMotion;
  const phase = useSharedValue(1);
  useEffect(() => {
    scheduleOnUI(() => {
      'worklet';
      phase.set(
        reduced ? 1 : withRepeat(withTiming(0.4, { duration: motion.duration.morph }), -1, true),
      );
    });
    return () => cancelAnimation(phase);
  }, [phase, reduced]);
  const animated = useAnimatedStyle(() => ({ opacity: phase.get() }));
  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: { gap: spacing.md, padding: spacing.lg },
        skeleton: {
          height: spacing.huge,
          borderRadius: radius.md,
          backgroundColor: colors.surface,
        },
      }),
    [colors],
  );
  return (
    <View accessibilityLabel={t('loading')} accessibilityState={{ busy: true }} style={styles.root}>
      {Array.from({ length: Math.min(8, Math.max(1, lines)) }, (_, index) => (
        <Animated.View key={index} style={[styles.skeleton, animated]} />
      ))}
    </View>
  );
}
