import { palette } from './tokens.js';

export interface ThemeColors {
  /** Fundo base da tela. O gradiente de profundidade é aplicado por cima. */
  background: string;
  backgroundElevated: string;
  /** Blobs do gradiente de fundo — dão o que refratar ao vidro. Ver spec 11 §1.2. */
  depthBlobA: string;
  depthBlobB: string;
  /** Terceiro blob (matiz fria) para uma aurora com mais profundidade. */
  depthBlobC: string;

  anatomyNeutral: string;
  anatomyOutline: string;
  surface: string;
  surfacePressed: string;
  /** Superfície sólida usada quando o vidro não está disponível. */
  surfaceGlassFallback: string;
  border: string;
  borderStrong: string;

  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textOnBrand: string;

  brand: string;
  brandPressed: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
}

export const darkTheme: ThemeColors = {
  background: palette.ink0,
  backgroundElevated: palette.ink50,
  // Aurora com presença: matizes saturados o suficiente para o fundo deixar de
  // ser chapado e ganhar o ar "gradient app" das referências, sem comprometer a
  // legibilidade das superfícies escuras por cima. Ver spec 11 §1.2.
  depthBlobA: 'rgba(91,140,255,0.14)',
  depthBlobB: 'rgba(62,207,142,0.07)',
  depthBlobC: 'rgba(138,107,255,0.08)',

  anatomyNeutral: palette.ink400,
  anatomyOutline: palette.ink200,
  surface: palette.ink100,
  surfacePressed: palette.ink200,
  surfaceGlassFallback: 'rgba(35,29,51,0.86)',
  border: 'rgba(200,189,216,0.14)',
  borderStrong: 'rgba(200,189,216,0.34)',

  textPrimary: palette.ink900,
  textSecondary: palette.ink700,
  textTertiary: palette.ink600,
  textOnBrand: palette.ink0,

  brand: palette.brand500,
  brandPressed: palette.brand400,
  success: palette.success,
  warning: palette.warning,
  danger: palette.danger,
  info: palette.info,
};

export const lightTheme: ThemeColors = {
  background: palette.ink900,
  backgroundElevated: palette.white,
  depthBlobA: 'rgba(91,140,255,0.08)',
  depthBlobB: 'rgba(62,207,142,0.04)',
  depthBlobC: 'rgba(138,107,255,0.05)',

  anatomyNeutral: palette.ink700,
  anatomyOutline: palette.ink900,
  surface: palette.white,
  surfacePressed: palette.brand50,
  surfaceGlassFallback: 'rgba(255,255,255,0.82)',
  border: 'rgba(52,43,73,0.12)',
  borderStrong: 'rgba(52,43,73,0.28)',

  textPrimary: palette.ink50,
  textSecondary: palette.ink400,
  textTertiary: palette.ink500,
  textOnBrand: palette.white,

  brand: palette.brand600,
  brandPressed: palette.brand700,
  success: '#137B4F',
  warning: '#946006',
  danger: '#B52D38',
  info: '#156B89',
};

export type ThemeName = 'dark' | 'light';
/** Escuro é o padrão do produto: o vidro tem mais presença e o uso
 *  acontece majoritariamente em academia com luz artificial. */
export const themes: Record<ThemeName, ThemeColors> = { dark: darkTheme, light: lightTheme };
