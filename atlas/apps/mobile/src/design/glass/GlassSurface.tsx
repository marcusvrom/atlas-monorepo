import { GlassView } from 'expo-glass-effect';
import { BlurView } from 'expo-blur';
import { useMemo, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { glass as glassTokens, radius as radiusTokens } from '@atlas/design-tokens';
import { useTheme } from '../theme-provider';
import { useGlassCapability } from './useGlassCapability';

export type GlassVariant = 'regular' | 'clear';

export interface GlassSurfaceProps {
  children?: ReactNode;
  variant?: GlassVariant;
  /** Tinta sutil aplicada ao material. Use com parcimônia. */
  tintColor?: string;
  radius?: keyof typeof radiusTokens;
  /** Habilita resposta ao toque no material nativo (iOS 26). */
  interactive?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Força uma capacidade específica — usado apenas em testes de snapshot. */
  forceCapability?: 'native' | 'blurFallback' | 'solid';
}

/**
 * ÚNICO ponto do app autorizado a renderizar vidro.
 * Nenhuma tela importa `expo-glass-effect` diretamente. Ver AGENTS.md R4.
 */
export function GlassSurface({
  children,
  variant = 'regular',
  tintColor,
  radius = 'lg',
  interactive = false,
  style,
  forceCapability,
}: GlassSurfaceProps) {
  const capability = useGlassCapability(forceCapability);
  const theme = useTheme();
  const tokens = glassTokens.variant[variant];

  const styles = useMemo(
    () =>
      StyleSheet.create({
        shape: {
          borderRadius: radiusTokens[radius],
          borderWidth: glassTokens.borderWidth,
          borderColor: theme.colors.border,
          overflow: 'hidden',
        },
        overlay: {
          backgroundColor: tintColor ?? theme.colors.surface,
          opacity: tokens.fallbackOpacity,
        },
        solid: { backgroundColor: theme.colors.surface },
      }),
    [radius, theme.colors, tintColor, tokens.fallbackOpacity],
  );

  if (capability === 'native') {
    return (
      <GlassView
        style={[styles.shape, style]}
        glassEffectStyle={variant}
        colorScheme={theme.name}
        isInteractive={interactive}
        {...(tintColor ? { tintColor } : {})}
      >
        {children}
      </GlassView>
    );
  }

  if (capability === 'blurFallback') {
    return (
      <View style={[styles.shape, style]}>
        <BlurView
          intensity={tokens.blurIntensity}
          tint={theme.name === 'dark' ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
        {/* Camada de tinta: garante contraste de texto no pior caso do fundo. */}
        <View style={[StyleSheet.absoluteFill, styles.overlay]} />
        {children}
      </View>
    );
  }

  // 'solid' — Reduzir Transparência ativo, ou modo de teste.
  return <View style={[styles.shape, styles.solid, style]}>{children}</View>;
}
