import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';
import { useTheme } from '../theme-provider';

/**
 * Fundo de todas as telas.
 *
 * Duas camadas lineares, nada mais. A base continua sendo o gradiente simples
 * aprovado em 10/09/2026; por cima vem uma **tinta diagonal** que desce do
 * canto superior direito e some no meio da tela.
 *
 * A tinta é deliberadamente linear e não radial: a rodada de 10/09 recusou os
 * pontos de luz do fundo (blobs com centro visível), e o que faltava não era
 * luz pontual — era a faixa de cor que dá aos apps das referências o ar de
 * "gradient app" em vez de tela cinza. Sem SVG, sem animação e sem blur: duas
 * views em gradiente, custo de composição zero por frame, e nada para desligar
 * quando "Reduzir movimento" está ativo.
 */
export function DepthBackground() {
  const { colors } = useTheme();
  return (
    <>
      <LinearGradient
        colors={[colors.background, colors.backgroundElevated]}
        style={[StyleSheet.absoluteFill, styles.inert]}
      />
      <LinearGradient
        colors={colors.backgroundWash}
        // Do canto superior direito até pouco abaixo da metade: o topo é onde
        // ficam saudação e cabeçalho, e é lá que a cor tem trabalho a fazer.
        start={{ x: 1, y: 0 }}
        end={{ x: 0.1, y: 0.62 }}
        style={[StyleSheet.absoluteFill, styles.inert]}
      />
    </>
  );
}

const styles = StyleSheet.create({ inert: { pointerEvents: 'none' } });
