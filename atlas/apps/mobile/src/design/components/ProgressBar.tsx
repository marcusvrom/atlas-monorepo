import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  gradients,
  progressAccent,
  radius,
  spacing,
  type ProgressAccent,
} from '@atlas/design-tokens';
import { useTheme } from '../theme-provider';

/**
 * Barra de progresso.
 *
 * O preenchimento é gradiente e não cor chapada, pelo mesmo motivo do anel e
 * das colunas de atividade: as três peças medem a mesma classe de coisa e
 * precisam parecer a mesma peça em escalas diferentes. O tom vem de `accent`,
 * mapeado em `progressAccent` — a tela escolhe o significado, não a cor.
 */
export function ProgressBar({
  value,
  label,
  accent = 'primary',
}: {
  value: number;
  label: string;
  accent?: ProgressAccent;
}) {
  const { colors } = useTheme();
  const progress = Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
  const gradient = gradients[progressAccent[accent]];

  const styles = useMemo(
    () =>
      StyleSheet.create({
        track: {
          height: spacing.sm,
          borderRadius: radius.pill,
          backgroundColor: colors.borderStrong,
          overflow: 'hidden',
        },
        fill: { height: '100%', width: `${progress * 100}%`, borderRadius: radius.pill },
      }),
    [colors, progress],
  );

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}
      style={styles.track}
    >
      <LinearGradient
        colors={gradient.colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.fill}
      />
    </View>
  );
}
