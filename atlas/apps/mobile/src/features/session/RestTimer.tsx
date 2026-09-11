import { useEffect, useMemo } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
  useAnimatedProps,
  useFrameCallback,
  useSharedValue,
} from 'react-native-reanimated';
import { gradients, spacing, typography } from '@atlas/design-tokens';
import { useTheme } from '../../design/theme-provider';
import { Text } from '../../design/components';
import { t } from '../../i18n';
import { remainingRest } from './session-summary';

const TimerText = Animated.createAnimatedComponent(TextInput);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/**
 * ATL-SES-005 — descanso como anel que esvazia.
 *
 * Antes era um número solto de 34 pt no meio da tela. O problema não é estético:
 * na academia o usuário olha o telefone de relance, muitas vezes de longe e com
 * o braço estendido, e um número exige **leitura**. Um anel esvaziando é
 * entendido em visão periférica, sem focar.
 *
 * Tudo roda na UI thread: `useFrameCallback` atualiza o `shared value` e os dois
 * `animatedProps` (texto e traço) derivam dele. Nenhum `setState` por frame — é
 * o que permite o timer continuar liso enquanto a lista de séries re-renderiza.
 */
export function RestTimer({
  deadline,
  totalSeconds,
  size = spacing.huge + spacing.xxl,
}: {
  deadline: number;
  /** Descanso prescrito, para o anel saber o que é "cheio". */
  totalSeconds: number;
  size?: number;
}) {
  const { colors } = useTheme();
  const remaining = useSharedValue(0);
  const stroke = spacing.sm;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  useFrameCallback(() => {
    remaining.set(remainingRest(deadline, Date.now()));
  });

  // `deadline` muda a cada série; sem reagir a ele o anel ficaria preso na
  // fração da série anterior até o primeiro frame novo.
  useEffect(() => {
    remaining.set(remainingRest(deadline, Date.now()));
  }, [deadline, remaining]);

  const textProps = useAnimatedProps(() => {
    const value = remaining.get();
    const text = Math.floor(value / 60) + ':' + String(value % 60).padStart(2, '0');
    return { text, defaultValue: text };
  });

  const ringProps = useAnimatedProps(() => {
    const total = Math.max(1, totalSeconds);
    const fraction = Math.max(0, Math.min(1, remaining.get() / total));
    return { strokeDashoffset: circumference * (1 - fraction) };
  });

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: { alignItems: 'center', justifyContent: 'center', width: size, height: size },
        center: {
          position: 'absolute',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        },
        timer: {
          color: colors.textPrimary,
          fontSize: typography.size.title2,
          fontWeight: typography.weight.bold,
          padding: spacing.none,
          textAlign: 'center',
        },
      }),
    [colors, size],
  );

  return (
    <View style={styles.root}>
      <Svg width={size} height={size} aria-hidden>
        <Defs>
          <LinearGradient id="rest-ring" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={gradients.mint.colors[0]} />
            <Stop offset="1" stopColor={gradients.mint.colors[1]} />
          </LinearGradient>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.borderStrong}
          strokeWidth={stroke}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#rest-ring)"
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={[circumference, circumference]}
          animatedProps={ringProps}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          strokeLinecap="round"
        />
      </Svg>
      <View style={styles.center}>
        <TimerText
          editable={false}
          animatedProps={textProps}
          style={styles.timer}
          accessibilityLabel={t('restTitle')}
          accessibilityRole="timer"
        />
        <Text variant="caption" tone="tertiary">
          {t('restTitle')}
        </Text>
      </View>
    </View>
  );
}
