import { useId, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { chart, spacing } from '@atlas/design-tokens';
import { useTheme } from '../theme-provider';
import { Text } from './Text';
import { sparklineArea, sparklineHead, sparklinePath } from './sparkline-path';

/**
 * Tendência compacta, para dentro de tiles e linhas de lista.
 *
 * Ganhou área em gradiente e um ponto no valor mais recente — o mesmo
 * tratamento do `MetricChart`, em miniatura, para que a leitura seja a mesma
 * nas duas escalas. Sem eixo e sem rótulo de propósito: o que essa peça
 * comunica é a **forma** da série, não valores.
 */
export function Sparkline({
  values,
  label,
  emptyLabel,
  width = spacing.huge * 3,
  height = spacing.huge,
}: {
  values: readonly number[];
  label: string;
  emptyLabel: string;
  width?: number;
  height?: number;
}) {
  const { colors } = useTheme();
  const inset = spacing.xs;
  const { line, area, head } = useMemo(
    () => ({
      line: sparklinePath(values, width, height, inset),
      area: sparklineArea(values, width, height, inset),
      head: sparklineHead(values, width, height, inset),
    }),
    [values, width, height, inset],
  );
  const uid = useId().replace(/:/g, '');
  const areaId = 'spark-' + uid;

  if (!line) return <Text tone="secondary">{emptyLabel}</Text>;

  return (
    // A acessibilidade fica no <View>, não no <Svg>: `accessible` num nó SVG
    // vaza como atributo booleano inválido no DOM da prévia web.
    <View accessible accessibilityRole="image" accessibilityLabel={label} style={styles.root}>
      <Svg width={width} height={height} viewBox={'0 0 ' + width + ' ' + height} aria-hidden>
        <Defs>
          <LinearGradient id={areaId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.brand} stopOpacity={chart.areaOpacityTop} />
            <Stop offset="1" stopColor={colors.brand} stopOpacity={chart.areaOpacityBottom} />
          </LinearGradient>
        </Defs>
        <Path d={area} fill={`url(#${areaId})`} />
        <Path
          d={line}
          stroke={colors.brand}
          strokeWidth={spacing.xxs}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {head ? <Circle cx={head.x} cy={head.y} r={spacing.xxs * 1.5} fill={colors.brand} /> : null}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({ root: { alignSelf: 'flex-start' } });
