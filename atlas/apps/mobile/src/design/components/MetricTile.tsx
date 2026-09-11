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
import { Card } from './Card';
import { Text } from './Text';

/**
 * Tile de métrica. Continua compatível com o uso simples (label/value/delta),
 * mas agora aceita um `accent` (ponto de cor no rótulo) e um `progress` opcional
 * (0..1) que desenha uma barra fina com o gradiente do tom — como os tiles de
 * "calorias/água/peso" das telas de referência. Cor sempre via `gradients` (R5).
 */
export function MetricTile({
  label,
  value,
  delta,
  deltaTone = 'secondary',
  accent,
  progress,
}: {
  label: string;
  value: string;
  delta?: string;
  deltaTone?: 'success' | 'warning' | 'danger' | 'secondary';
  accent?: ProgressAccent;
  progress?: number;
}) {
  const { colors } = useTheme();
  const gradient = accent ? gradients[progressAccent[accent]] : null;
  const clamped =
    progress !== undefined && Number.isFinite(progress) ? Math.max(0, Math.min(1, progress)) : null;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        content: { gap: spacing.sm },
        labelRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
        dot: {
          width: spacing.sm,
          height: spacing.sm,
          borderRadius: radius.pill,
          backgroundColor: gradient ? gradient.colors[0] : colors.textTertiary,
        },
        track: {
          height: spacing.xs,
          borderRadius: radius.pill,
          backgroundColor: colors.borderStrong,
          overflow: 'hidden',
        },
        fill: {
          width: clamped === null ? '0%' : `${clamped * 100}%`,
          height: '100%',
          borderRadius: radius.pill,
        },
      }),
    [colors, gradient, clamped],
  );

  return (
    <Card>
      <View style={styles.content}>
        <View style={styles.labelRow}>
          {accent ? <View style={styles.dot} /> : null}
          <Text tone="secondary" variant="footnote">
            {label}
          </Text>
        </View>
        <Text variant="title1" weight="bold">
          {value}
        </Text>
        {delta ? <Text tone={deltaTone}>{delta}</Text> : null}
        {clamped !== null ? (
          <View style={styles.track}>
            <LinearGradient
              colors={gradient ? gradient.colors : [colors.brand, colors.brand]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.fill}
            />
          </View>
        ) : null}
      </View>
    </Card>
  );
}
