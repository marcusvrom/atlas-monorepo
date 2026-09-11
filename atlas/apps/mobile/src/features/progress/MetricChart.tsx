import { useId, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Line, Path, Stop } from 'react-native-svg';
import type { MetricSeries } from '@atlas/contracts';
import { chart, gradients, layout, radius, spacing } from '@atlas/design-tokens';
import { useTheme } from '../../design/theme-provider';
import { Button, Text } from '../../design/components';
import { formatBodyMeasurement, formatShortDate, formatWeight } from '../../lib/format';
import { t } from '../../i18n';
import { metricGeometry, touchBands } from './chart-geometry';
import { axisTicks, describeSeries } from './chart-summary';

const CHART_HEIGHT = spacing.huge * 2 + spacing.xl;

/**
 * Evolução de uma métrica ao longo do tempo.
 *
 * O que mudou nesta rodada, e por quê:
 *
 * - **A unidade mora no título**, não repetida em cada número. O título diz o
 *   que se mede e em quê; o eixo diz quando; o tooltip repete a unidade porque
 *   ele precisa ser compreensível sozinho quando lido por leitor de tela.
 * - **O gráfico é selecionável.** Faixas de toque cobrem a largura inteira
 *   (ver `touchBands`), com alvo confortável mesmo em série densa, e cada faixa
 *   é um botão de verdade — o que dá foco por teclado na web de graça. A
 *   seleção fica até outra ser feita, e há uma saída explícita.
 * - **O ponto selecionado é destacado sem apagar os demais**: ganha guia
 *   vertical e anel, enquanto os outros continuam desenhados. Esconder o resto
 *   transformaria "ver um valor" em "perder o contexto".
 * - **A tendência não é comunicada só por cor.** A linha suavizada continua na
 *   cor da marca, mas o sentido ("Aumento de 60 kg para 67,5 kg") está escrito
 *   na descrição e no rodapé.
 * - **Sem dado, sem eixo.** Um par de réguas vazias parece um gráfico quebrado;
 *   o lugar passa a explicar o que falta e por que registrar ajuda.
 *
 * Os pontos crus continuam desenhados por cima da linha em tom secundário: a
 * suavização não pode esconder a dispersão real da medição.
 */
export function MetricChart({ series, label }: { series: MetricSeries; label: string }) {
  const { colors } = useTheme();
  const geometry = useMemo(() => metricGeometry(series), [series]);
  const bands = useMemo(() => touchBands(geometry.points), [geometry]);
  const [selected, setSelected] = useState<number | null>(null);
  const uid = useId().replace(/:/g, '');
  const areaId = 'metric-area-' + uid;
  const { box } = geometry;

  // Peso corporal e composição pedem uma casa; carga segue a regra da carga.
  // A mesma função imprime o número no gráfico e na descrição acessível, senão
  // o leitor de tela ouviria um valor que ninguém vê na tela.
  const display = series.unit === 'kg' ? formatWeight : formatBodyMeasurement;

  // A unidade entra no título uma vez só. A guarda existe porque alguns
  // rótulos do app já nascem com a unidade (o campo "Peso atual (kg)" do
  // formulário), e concatenar cegamente produzia "Peso atual (kg) (kg)".
  const suffix = ' (' + series.unit + ')';
  const title = series.unit && !label.endsWith(suffix) ? label + suffix : label;
  const latest = series.points.at(-1);
  const selectedPoint = selected === null ? null : (series.points[selected] ?? null);
  const shown = selectedPoint ?? latest ?? null;

  const summary = useMemo(
    () =>
      describeSeries({
        label: title,
        unit: series.unit,
        points: series.points.map((point) => ({
          at: point.at,
          value: point.smoothed ?? point.raw,
        })),
        format: display,
      }),
    [title, series, display],
  );

  const ticks = useMemo(
    () => axisTicks(series.points.map((point) => ({ at: point.at, value: point.raw }))),
    [series],
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: { gap: spacing.sm },
        plot: { height: CHART_HEIGHT },
        overlay: { ...StyleSheet.absoluteFill, flexDirection: 'row' },
        band: { position: 'absolute', top: 0, bottom: 0, minWidth: spacing.xs },
        axis: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
        tooltip: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: spacing.sm,
          padding: spacing.md,
          borderRadius: radius.md,
          backgroundColor: colors.surface,
        },
        tooltipCopy: { flex: 1, minWidth: layout.stepperValue, gap: spacing.xxs },
        empty: { gap: spacing.xs, paddingVertical: spacing.lg },
      }),
    [colors],
  );

  // Sem ponto não há gráfico — e um par de eixos vazios seria lido como falha.
  if (!series.points.length) {
    return (
      <View style={styles.root}>
        <Text weight="bold">{title}</Text>
        <View style={styles.empty}>
          <Text tone="secondary">{t('chartEmptyTitle')}</Text>
          <Text variant="footnote" tone="tertiary">
            {t('chartEmptyWhy')}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Text weight="bold">{title}</Text>
      <Text variant="display" weight="bold">
        {display(shown?.smoothed ?? shown?.raw)}
      </Text>
      <Text variant="footnote" tone="secondary">
        {(selectedPoint ? t('chartSelectHint') : t('chartLatest')) +
          (shown ? ' · ' + formatShortDate(shown.at) : '')}
      </Text>

      <View style={styles.plot}>
        <Svg
          viewBox={`0 0 ${box.width} ${box.height}`}
          width="100%"
          height={CHART_HEIGHT}
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

          {/* Guia vertical da seleção: entra **atrás** da linha para não cortá-la. */}
          {selected !== null && geometry.points[selected] ? (
            <Line
              x1={geometry.points[selected]!.x}
              y1={box.inset}
              x2={geometry.points[selected]!.x}
              y2={box.baseline}
              stroke={colors.brand}
              strokeWidth={chart.gridOpacity * spacing.md}
            />
          ) : null}

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

          {/* Anel da seleção, por cima de tudo: marca sem apagar o resto. */}
          {selected !== null && geometry.points[selected] ? (
            <Circle
              cx={geometry.points[selected]!.x}
              cy={geometry.points[selected]!.smoothY ?? geometry.points[selected]!.rawY}
              r={chart.dotRadius * 1.6}
              fill={colors.background}
              stroke={colors.brand}
              strokeWidth={chart.lineWidth}
            />
          ) : null}
        </Svg>

        {/* Alvos de toque sobre o desenho. Cada um é um botão nomeado: o leitor
            de tela percorre a série ponto a ponto, e a web ganha foco visível
            pela mesma via. */}
        <View style={styles.overlay}>
          {bands.map((band, index) => {
            const point = series.points[index];
            if (!point) return null;
            const value = display(point.smoothed ?? point.raw);
            return (
              <Pressable
                key={point.at + index}
                accessibilityRole="button"
                accessibilityState={{ selected: selected === index }}
                // O estado de seleção vai **no rótulo**, e não só em
                // `accessibilityState`: o react-native-web não emite
                // `aria-selected` para `role="button"`, então quem navega por
                // leitor de tela perderia a única pista de onde está.
                accessibilityLabel={t(
                  selected === index ? 'chartSelectedPoint' : 'chartSelectPoint',
                )
                  .replace('{date}', formatShortDate(point.at))
                  .replace('{value}', series.unit ? value + ' ' + series.unit : value)}
                onPress={() => setSelected(selected === index ? null : index)}
                style={[styles.band, { left: `${band.left}%`, width: `${band.width}%` } as const]}
              />
            );
          })}
        </View>
      </View>

      <View style={styles.axis}>
        {ticks.map((tick) => (
          <Text key={tick.at} variant="caption" tone="secondary">
            {formatShortDate(tick.at)}
          </Text>
        ))}
      </View>

      {selectedPoint ? (
        <View style={styles.tooltip} accessibilityLiveRegion="polite">
          <View style={styles.tooltipCopy}>
            <Text variant="caption" tone="secondary">
              {formatShortDate(selectedPoint.at)}
            </Text>
            <Text weight="bold">
              {display(selectedPoint.smoothed ?? selectedPoint.raw)} {series.unit}
            </Text>
          </View>
          <Button
            variant="ghost"
            label={t('chartClearSelection')}
            onPress={() => setSelected(null)}
          />
        </View>
      ) : null}

      {/* A descrição é o gráfico em palavras: mesma unidade, mesmo período,
          mesmos extremos. Fica acessível ao leitor de tela e invisível na tela
          só porque o desenho já a representa para quem enxerga. */}
      <Text variant="subhead" tone="secondary" accessibilityRole="summary">
        {summary}
      </Text>
      <Text variant="footnote" tone="tertiary">
        {t('chartLegend')}
      </Text>
    </View>
  );
}
