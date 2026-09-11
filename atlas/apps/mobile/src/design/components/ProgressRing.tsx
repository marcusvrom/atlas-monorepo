import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import {
  gradients,
  motion,
  progressAccent,
  spacing,
  type ProgressAccent,
} from '@atlas/design-tokens';
import { useAccessibilityPreferences } from '../accessibility';
import { useTheme } from '../theme-provider';
import { Text } from './Text';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/**
 * Anel de progresso no estilo "activity ring": traço em gradiente da marca,
 * valor grande no centro e preenchimento que anima na montagem (UI thread,
 * desligado com "Reduzir movimento"). O gradiente vem de `gradients` via o tom
 * semântico `accent` (R5). Ver referências em ui-examples.
 */
export function ProgressRing({
  value,
  label,
  size = spacing.huge + spacing.xxxl,
  accent = 'primary',
}: {
  value: number;
  label: string;
  size?: number;
  accent?: ProgressAccent;
}) {
  const { colors } = useTheme();
  const reduced = useAccessibilityPreferences().reduceMotion;
  const progress = Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
  const stroke = spacing.sm;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const gradient = gradients[progressAccent[accent]];

  const animated = useSharedValue(reduced ? progress : 0);
  useEffect(() => {
    animated.set(
      reduced
        ? progress
        : withTiming(progress, {
            duration: motion.duration.slow,
            easing: Easing.out(Easing.cubic),
          }),
    );
  }, [progress, reduced, animated]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animated.value),
  }));

  const gradientId = 'ring-' + accent;

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}
      style={[styles.root, { width: size, height: size }]}
    >
      <Svg width={size} height={size} aria-hidden>
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={gradient.colors[0]} />
            <Stop offset="1" stopColor={gradient.colors[1]} />
          </LinearGradient>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.borderStrong}
          strokeWidth={stroke}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={`url(#${gradientId})`}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={[circumference, circumference]}
          animatedProps={animatedProps}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          strokeLinecap="round"
        />
      </Svg>
      <View style={styles.center}>
        {/* O valor acompanha o diâmetro: fixo em `title1`, ele encostava no
            traço nos anéis pequenos (os de card) e sobrava nos grandes. */}
        <Text variant={size >= spacing.huge * 2 ? 'title1' : 'title3'} weight="bold">
          {Math.round(progress * 100).toLocaleString('pt-BR')}
          {'%'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', justifyContent: 'center' },
  center: {
    pointerEvents: 'none',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
