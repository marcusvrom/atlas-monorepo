import { useMemo, type ReactNode } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import {
  elevation,
  glass,
  gradients,
  palette,
  opacity,
  radius as radiusTokens,
  spacing,
  type GradientName,
} from '@atlas/design-tokens';
import { useTheme } from '../theme-provider';

/**
 * Superfície de destaque com gradiente da marca — o "hero" das telas de
 * referência. NÃO é vidro (é opaca), então dispensa <GlassSurface>: serve
 * justamente aos blocos que devem saltar sobre a aurora do fundo. Todo par de
 * cor vem de `gradients` (R5); nenhuma tela inventa gradiente. Um brilho branco
 * sutil no topo imita o verniz do material sem custo de blur.
 */
export function GradientSurface({
  children,
  name = 'brand',
  radius = 'xl',
  level = 'md',
  style,
}: {
  children?: ReactNode;
  name?: GradientName;
  radius?: keyof typeof radiusTokens;
  level?: keyof typeof elevation;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const gradient = gradients[name];
  const shadow = elevation[level];
  const { start, end } = useMemo(() => angleToVector(gradient.angle), [gradient.angle]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          borderRadius: radiusTokens[radius],
          borderWidth: glass.borderWidth,
          borderColor: colors.borderStrong,
          padding: spacing.lg,
          overflow: 'hidden',
          shadowColor: palette.black,
          shadowOpacity: shadow.shadowOpacity,
          shadowRadius: shadow.shadowRadius,
          shadowOffset: { width: spacing.none, height: spacing.xs },
          elevation: shadow.elevation,
        },
        sheen: { opacity: opacity.subtle },
      }),
    [colors, radius, shadow],
  );

  return (
    <View style={[styles.root, style]}>
      <LinearGradient
        colors={gradient.colors}
        start={start}
        end={end}
        style={StyleSheet.absoluteFill}
      />
      {/* Verniz: brilho branco no canto superior, bem sutil. */}
      <LinearGradient
        colors={[palette.white, 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.6, y: 0.6 }}
        style={[StyleSheet.absoluteFill, styles.sheen]}
      />
      {children}
    </View>
  );
}

/** Converte um ângulo (graus, 0 = →, cresce no sentido horário) em start/end. */
function angleToVector(angle: number): {
  start: { x: number; y: number };
  end: { x: number; y: number };
} {
  const rad = (angle * Math.PI) / 180;
  const dx = Math.cos(rad);
  const dy = Math.sin(rad);
  return {
    start: { x: 0.5 - dx / 2, y: 0.5 - dy / 2 },
    end: { x: 0.5 + dx / 2, y: 0.5 + dy / 2 },
  };
}
