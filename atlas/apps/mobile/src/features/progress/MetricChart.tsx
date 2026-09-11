import { formatWeight } from '../../lib/format-weight';
import { useId, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Line, Path, Stop } from 'react-native-svg';
import type { MetricSeries } from '@atlas/contracts';
import { chart, gradients, spacing } from '@atlas/design-tokens';
import { useTheme } from '../../design/theme-provider';
import { Text } from '../../design/components';
import { t } from '../../i18n';
import { metricGeometry } from './chart-geometry';

/**
 * Evolução de uma métrica ao longo do tempo.
 *
 * A linha suavizada ganhou **área em gradiente** e um marcador no ponto mais
 * recente — o desenho de "Weight Dynamics"/"Travel Stats" das referências. Não
 * é só enfeite: a área dá massa para a tendência ser lida de longe, e o
 * marcador responde à pergunta que o usuário sempre faz primeiro ("onde estou
 * hoje?") sem precisar rastrear a ponta da linha com o olho.
 *
 * Os pontos crus continuam desenhados por cima em tom secundário: a suavização
 * não pode esconder a dispersão real da medição.
 */
export function MetricChart({ series, label }: { series: MetricSeries; label: string }) {
  const { colors } = useTheme();
  const geometry = useMemo(() => metricGeometry(series), [series]);
  const latest = series.points.at(-1);
  const uid = useId().replace(/:/g, '');
  const areaId = 'metric-area-' + uid;
  const { box } = geometry;
  const display = (value: number | null | undefined) =>
    series.unit === 'kg'
      ? formatWeight(value)
      : (value?.toLocaleString('pt-BR', { maximumFractionDigits: 2 }) ?? '—');

  return (
    <View
      style={styles.root}
      accessible
      accessibilityRole="image"
      accessibilityLabel={
        label +
        ': ' +
        display(latest?.smoothed ?? latest?.raw) +
        ' ' +
        series.unit +
        '. ' +
        t('chartLegend')
      }
    >
      <Text weight="bold">{label}</Text>
      <Text variant="display" weight="bold">
        {display(latest?.smoothed ?? latest?.raw)} {series.unit}
      </Text>
      <Svg
        viewBox={`0 0 ${box.width} ${box.height}`}
        width="100%"
        height={spacing.huge * 2 + spacing.xl}
        aria-hidden={true}
      >
        <Defs>
          <LinearGradient id={areaId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.brand} stopOpacity={chart.areaOpacityTop} />
            <Stop offset="1" stopColor={colors.brand} stopOpacity={chart.areaOpacityBottom} />
          </LinearGradient>
        </Defs>

        {/* Base do gráfico: uma única régua, para a área ter onde assentar. */}
        <Line
          x1={box.inset}
          y1={box.baseline}
          x2={box.width - box.inset}
          y2={box.baseline}
          stroke={colors.borderStrong}
          strokeWidth={chart.gridOpacity * spacing.sm}
        />

        {geometry.area ? <Path d={geometry.area} fill={`url(#${areaId})`} /> : null}

        {geometry.points.map((point, index) => (
          <Circle
            key={index}
            cx={point.x}
            cy={point.rawY}
            r={spacing.xxs}
            fill={colors.textTertiary}
          />
        ))}

        <Path
          d={geometry.path}
          stroke={colors.brand}
          strokeWidth={chart.lineWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {geometry.head ? (
          <>
            <Circle
              cx={geometry.head.x}
              cy={geometry.head.smoothY ?? box.baseline}
              r={chart.dotRadius * 1.9}
              fill={gradients.brand.colors[0]}
              opacity={chart.areaOpacityTop}
            />
            <Circle
              cx={geometry.head.x}
              cy={geometry.head.smoothY ?? box.baseline}
              r={chart.dotRadius}
              fill={colors.brand}
              stroke={colors.background}
              strokeWidth={chart.lineWidth * 0.7}
            />
          </>
        ) : null}
      </Svg>
      <View style={styles.dates}>
        <Text variant="caption" tone="secondary">
          {series.points[0]
            ? new Date(series.points[0].at).toLocaleDateString('pt-BR', {
                day: 'numeric',
                month: 'short',
              })
            : ''}
        </Text>
        <Text variant="caption" tone="secondary">
          {latest
            ? new Date(latest.at).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
            : ''}
        </Text>
      </View>
      <Text variant="subhead" tone="secondary">
        {t('dashboardTrend')}:{' '}
        {series.trendPerWeek === null ? '—' : display(series.trendPerWeek) + ' ' + series.unit}
      </Text>
      <Text variant="footnote" tone="secondary">
        {t('chartLegend')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.sm },
  dates: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
});
