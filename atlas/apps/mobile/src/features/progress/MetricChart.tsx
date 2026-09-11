import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import type { MetricSeries } from '@atlas/contracts';
import { spacing } from '@atlas/design-tokens';
import { useTheme } from '../../design/theme-provider';
import { Text } from '../../design/components';
import { t } from '../../i18n';
import { metricGeometry } from './chart-geometry';
export function MetricChart({ series, label }: { series: MetricSeries; label: string }) {
  const { colors } = useTheme();
  const geometry = useMemo(() => metricGeometry(series), [series]);
  const latest = series.points.at(-1);
  return (
    <View
      style={styles.root}
      accessible
      accessibilityRole="image"
      accessibilityLabel={
        label +
        ': ' +
        (latest?.smoothed ?? latest?.raw ?? 0).toLocaleString('pt-BR') +
        ' ' +
        series.unit +
        '. ' +
        t('chartLegend')
      }
    >
      <Text weight="bold">{label}</Text>
      <Text variant="display" weight="bold">
        {(latest?.smoothed ?? latest?.raw)?.toLocaleString('pt-BR') ?? '—'} {series.unit}
      </Text>
      <Svg
        viewBox="0 0 300 150"
        width="100%"
        height={spacing.huge * 2 + spacing.xl}
        aria-hidden={true}
      >
        {geometry.points.map((point, index) => (
          <Circle
            key={index}
            cx={point.x}
            cy={point.rawY}
            r={spacing.xxs}
            fill={colors.textSecondary}
          />
        ))}
        <Path d={geometry.path} stroke={colors.brand} strokeWidth={spacing.xs} fill="none" />
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
        {series.trendPerWeek === null
          ? '—'
          : series.trendPerWeek.toLocaleString('pt-BR', { maximumFractionDigits: 2 }) +
            ' ' +
            series.unit}
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
