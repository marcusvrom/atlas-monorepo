import { useMemo } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  useFrameCallback,
} from 'react-native-reanimated';
import { spacing, typography } from '@atlas/design-tokens';
import { useTheme } from '../../design/theme-provider';
import { Text } from '../../design/components';
import { t } from '../../i18n';
import { remainingRest } from './session-summary';
const TimerText = Animated.createAnimatedComponent(TextInput);
export function RestTimer({ deadline }: { deadline: number }) {
  const { colors } = useTheme();
  const remaining = useSharedValue(0);
  useFrameCallback(() => {
    remaining.set(remainingRest(deadline, Date.now()));
  });
  const props = useAnimatedProps(() => {
    const value = remaining.get();
    const text = Math.floor(value / 60) + ':' + String(value % 60).padStart(2, '0');
    return { text, defaultValue: text };
  });
  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: { gap: spacing.xs },
        timer: {
          color: colors.textPrimary,
          fontSize: typography.size.display,
          fontWeight: typography.weight.bold,
          padding: spacing.none,
        },
      }),
    [colors],
  );
  return (
    <View style={styles.root}>
      <Text>{t('restTitle')}</Text>
      <TimerText
        editable={false}
        animatedProps={props}
        style={styles.timer}
        accessibilityLabel={t('restTitle')}
        accessibilityRole="timer"
      />
    </View>
  );
}
