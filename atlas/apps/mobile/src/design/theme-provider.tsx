import { useAccessibilityPreferences } from './accessibility';
import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useDemoSettings } from '../dev/demo-settings';
import {
  motion,
  radius,
  spacing,
  themes,
  typography,
  type ThemeColors,
  type ThemeName,
} from '@atlas/design-tokens';

export interface Theme {
  name: ThemeName;
  colors: ThemeColors;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  motion: typeof motion;
}

const ThemeContext = createContext<Theme | null>(null);

export function ThemeProvider({
  children,
  forceName,
}: {
  children: ReactNode;
  forceName?: ThemeName;
}) {
  const settings = useDemoSettings();
  const { highContrast } = useAccessibilityPreferences();
  // Escuro é o padrão do produto, não o do sistema. Ver spec 11 §6.
  const name: ThemeName = forceName ?? (__DEV__ ? settings.theme : 'dark');

  const value = useMemo<Theme>(
    () => ({
      name,
      colors: highContrast
        ? {
            ...themes[name],
            border: themes[name].textSecondary,
            borderStrong: themes[name].textPrimary,
          }
        : themes[name],
      spacing,
      radius,
      typography,
      motion,
    }),
    [name, highContrast],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error('useTheme precisa estar dentro de <ThemeProvider>');
  return theme;
}
