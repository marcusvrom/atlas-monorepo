import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { AvatarConfig } from '@atlas/contracts';
import { glass, layout, opacity, palette, radius, spacing } from '@atlas/design-tokens';
import { Icon, Text } from '../../design/components';
import { useTheme } from '../../design/theme-provider';
import { Avatar } from './Avatar';

const SWATCH = spacing.huge + spacing.lg;

/**
 * ATL-AVT-002 — uma opção de peça, mostrada **como ela fica**.
 *
 * Esta é a correção central da montagem do avatar. Antes, cada opção era um
 * chip escrito "cabelo 3": para saber o que era o cabelo 3 só havia um caminho,
 * tocar e olhar o preview — oito toques para ver oito cabelos, e nenhuma forma
 * de comparar dois sem alternar entre eles. O swatch renderiza o avatar inteiro
 * com aquela peça aplicada, então a grade inteira é comparável de relance.
 *
 * O recorte (`zoom`/`offsetY`) existe porque a peça relevante ocupa regiões
 * diferentes do retrato: aproximar o rosto para escolher cabelo e afastar para
 * escolher roupa é o que torna a diferença entre duas opções visível num
 * quadrado de 80 pt.
 */
export function AvatarSwatch({
  config,
  selected,
  locked = false,
  zoom = 1,
  offsetY = 0,
  label,
  onPress,
}: {
  /** Config completa já com a peça candidata aplicada. */
  config: AvatarConfig;
  selected: boolean;
  locked?: boolean;
  zoom?: number;
  offsetY?: number;
  /** Lido pelo leitor de tela — o swatch é visual, o rótulo é textual. */
  label: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          width: SWATCH,
          height: SWATCH,
          borderRadius: radius.lg,
          borderWidth: selected ? spacing.xxs : glass.borderWidth,
          borderColor: selected ? colors.brand : colors.border,
          backgroundColor: colors.surface,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
        },
        art: { transform: [{ scale: zoom }, { translateY: offsetY }] },
        pressed: { opacity: opacity.pressed },
        lock: {
          position: 'absolute',
          top: spacing.xs,
          right: spacing.xs,
          width: layout.iconSize,
          height: layout.iconSize,
          borderRadius: radius.pill,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.brand,
        },
        // Mesmo tratamento do selo premium: pastilha cheia. Um ícone solto
        // sobre o retrato fica à mercê da cor do avatar por baixo.
        check: {
          position: 'absolute',
          bottom: spacing.xs,
          right: spacing.xs,
          width: layout.iconSize,
          height: layout.iconSize,
          borderRadius: radius.pill,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.brand,
        },
      }),
    [colors, selected, zoom, offsetY],
  );

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled: false }}
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.root, pressed && styles.pressed]}
    >
      <View style={styles.art}>
        <Avatar config={config} size={SWATCH} decorative />
      </View>
      {locked ? (
        <View style={styles.lock}>
          <Icon name="sparkles" size={layout.iconSize * 0.7} color={palette.ink0} />
        </View>
      ) : null}
      {selected ? (
        <View style={styles.check}>
          <Icon name="check" size={layout.iconSize * 0.7} color={palette.ink0} />
        </View>
      ) : null}
    </Pressable>
  );
}

/**
 * Swatch de cor. Um círculo cheio, sem retrato: a cor não precisa de contexto
 * para ser avaliada, e repetir o avatar inteiro oito vezes só para variar um
 * tom faria a grade de cor competir com a grade de peças.
 */
export function ColorSwatch({
  color,
  selected,
  label,
  onPress,
}: {
  color: string;
  selected: boolean;
  label: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          width: spacing.xxl + spacing.sm,
          height: spacing.xxl + spacing.sm,
          borderRadius: radius.pill,
          backgroundColor: color,
          borderWidth: selected ? spacing.xxs : glass.borderWidth,
          borderColor: selected ? colors.textPrimary : colors.borderStrong,
          alignItems: 'center',
          justifyContent: 'center',
        },
        pressed: { opacity: opacity.pressed },
      }),
    [colors, color, selected],
  );
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.root, pressed && styles.pressed]}
    >
      {selected ? <Icon name="check" size={spacing.lg} color={palette.ink0} /> : null}
    </Pressable>
  );
}

/** Swatch da opção "sem peça" — acessório e moldura podem ser nenhum. */
export function NoneSwatch({
  selected,
  label,
  onPress,
}: {
  selected: boolean;
  label: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          width: SWATCH,
          height: SWATCH,
          borderRadius: radius.lg,
          borderWidth: selected ? spacing.xxs : glass.borderWidth,
          borderColor: selected ? colors.brand : colors.border,
          backgroundColor: colors.backgroundElevated,
          alignItems: 'center',
          justifyContent: 'center',
          padding: spacing.sm,
        },
        pressed: { opacity: opacity.pressed },
      }),
    [colors, selected],
  );
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.root, pressed && styles.pressed]}
    >
      <Text variant="caption" tone="secondary">
        {label}
      </Text>
    </Pressable>
  );
}
