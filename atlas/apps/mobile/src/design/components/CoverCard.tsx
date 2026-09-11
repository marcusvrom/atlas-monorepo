import { useMemo, type ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { cover, elevation, glass, motion, palette, radius, spacing } from '@atlas/design-tokens';
import { CoverImage } from '../media/CoverImage';
import type { CoverGlyph } from '../media/cover-art';
import { useAccessibilityPreferences } from '../accessibility';
import { useTheme } from '../theme-provider';
import { Icon } from './Icon';
import { Text } from './Text';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Card de capa — a peça central da linguagem visual das referências.
 *
 * Capa ocupando o card inteiro, véu escuro no rodapé e o texto por cima:
 * o conteúdo aparece **dentro** da imagem em vez de ao lado dela, que é o que
 * separa uma tela de app de uma tabela com miniatura.
 *
 * Três decisões que valem registro:
 *
 * 1. O texto vive sobre o véu (`scrim`), nunca sobre a arte crua — é o que
 *    mantém AA independentemente de onde o foco de luz da capa caiu.
 * 2. A altura vem do chamador (`height`), não de uma proporção fixa: o mesmo
 *    componente serve o hero de 200 pt da home e o card de 150 pt do trilho.
 * 3. O toque escala em spring como no `Button`, para o card não parecer um
 *    banner estático. Desligado com "Reduzir movimento".
 */
export function CoverCard({
  seed,
  title,
  eyebrow,
  subtitle,
  glyph,
  uri,
  asset,
  height,
  showPlay = false,
  meta,
  footer,
  onPress,
  accessibilityLabel,
  style,
}: {
  /** Identificador de domínio estável — ver `design/media/cover-art.ts`. */
  seed: string;
  title: string;
  eyebrow?: string;
  subtitle?: string;
  glyph?: CoverGlyph;
  uri?: string | null;
  asset?: number;
  height: number;
  /** Selo de reprodução, para conteúdo com vídeo/execução. */
  showPlay?: boolean;
  /** Linha de `<MetaChip onCover>` abaixo do título. */
  meta?: ReactNode;
  /** Conteúdo extra no rodapé (barra de progresso, por exemplo). */
  footer?: ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const reduced = useAccessibilityPreferences().reduceMotion;
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          height,
          borderRadius: radius.xl,
          overflow: 'hidden',
          borderWidth: glass.borderWidth,
          borderColor: colors.borderStrong,
          shadowColor: palette.black,
          shadowOpacity: elevation.md.shadowOpacity,
          shadowRadius: elevation.md.shadowRadius,
          shadowOffset: { width: spacing.none, height: spacing.xs },
          elevation: elevation.md.elevation,
        },
        cover: { flex: 1 },
        body: {
          flex: 1,
          justifyContent: 'flex-end',
          padding: spacing.lg,
          gap: spacing.sm,
        },
        play: {
          pointerEvents: 'none',
          position: 'absolute',
          top: spacing.lg,
          right: spacing.lg,
          width: spacing.xxl + spacing.sm,
          height: spacing.xxl + spacing.sm,
          borderRadius: radius.pill,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: glass.borderWidth,
          borderColor: cover.onCoverBorder,
          backgroundColor: cover.onCoverSurface,
        },
      }),
    [colors, height],
  );

  const content = (
    <CoverImage
      seed={seed}
      uri={uri}
      asset={asset}
      glyph={glyph}
      scrim
      radius="xl"
      style={styles.cover}
    >
      {showPlay ? (
        <View style={styles.play}>
          <Icon name="play" color={palette.ink900} filled />
        </View>
      ) : null}
      <View style={styles.body}>
        {eyebrow ? (
          <Text tone="onAccent" variant="caption" weight="bold">
            {eyebrow.toUpperCase()}
          </Text>
        ) : null}
        <Text tone="onAccent" variant="title3" weight="bold" numberOfLines={2}>
          {title}
        </Text>
        {subtitle ? (
          <Text tone="onAccent" variant="footnote" numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
        {meta}
        {footer}
      </View>
    </CoverImage>
  );

  if (!onPress) return <View style={[styles.root, style]}>{content}</View>;

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      onPress={onPress}
      onPressIn={() => {
        if (!reduced) scale.set(withSpring(motion.pressScale, motion.spring.snappy));
      }}
      onPressOut={() => {
        if (!reduced) scale.set(withSpring(1, motion.spring.snappy));
      }}
      style={[styles.root, animatedStyle, style]}
    >
      {content}
    </AnimatedPressable>
  );
}
