import { useAccessibilityPreferences } from '../accessibility';
import { useMemo } from 'react';
import { Text as RNText, type TextProps as RNTextProps, StyleSheet } from 'react-native';
import { palette, typography } from '@atlas/design-tokens';
import { useTheme } from '../theme-provider';

type Variant = keyof typeof typography.size;
type Tone =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'brand'
  | 'success'
  | 'warning'
  | 'danger'
  /** Texto sobre superfícies de gradiente profundo (GradientSurface). Claro nos
   *  dois temas — os gradientes de hero são saturados e escuros o suficiente. */
  | 'onAccent';

export interface TextProps extends RNTextProps {
  variant?: Variant;
  tone?: Tone;
  weight?: keyof typeof typography.weight;
}

export function Text({ variant = 'body', tone = 'primary', weight, style, ...rest }: TextProps) {
  const theme = useTheme();
  const { highContrast } = useAccessibilityPreferences();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        label: {
          fontSize: typography.size[variant],
          lineHeight: typography.lineHeight[variant],
          color: toneColor(theme.colors, tone),
          fontWeight: typography.weight[highContrast ? 'bold' : (weight ?? 'regular')],
        },
      }),
    [theme.colors, variant, tone, weight, highContrast],
  );
  return <RNText {...rest} style={[styles.label, style]} />;
}

function toneColor(colors: ReturnType<typeof useTheme>['colors'], tone: Tone): string {
  switch (tone) {
    case 'secondary':
      return colors.textSecondary;
    case 'tertiary':
      return colors.textTertiary;
    case 'brand':
      return colors.brand;
    case 'success':
      return colors.success;
    case 'warning':
      return colors.warning;
    case 'danger':
      return colors.danger;
    case 'onAccent':
      return palette.ink900;
    default:
      return colors.textPrimary;
  }
}

export const textStyles = StyleSheet.create({});
