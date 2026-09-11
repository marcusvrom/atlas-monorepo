import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';
import { useTheme } from '../theme-provider';
/** ATL-UI-001: gradiente simples aprovado em 10/09/2026, sem pontos de luz. */
export function DepthBackground() {
  const { colors } = useTheme();
  return (
    <LinearGradient
      colors={[colors.background, colors.backgroundElevated]}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    />
  );
}
