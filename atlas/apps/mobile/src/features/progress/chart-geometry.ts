import type { MetricSeries } from '@atlas/contracts';

/**
 * Caixa de desenho do gráfico, em unidades do viewBox (não em pixels): o SVG
 * escala para a largura disponível, então a geometria é resolvida uma vez e
 * serve qualquer tamanho de tela.
 */
const BOX = { width: 300, height: 150, inset: 8, baseline: 132, plotHeight: 120 } as const;

export interface MetricPlotPoint {
  x: number;
  rawY: number;
  smoothY: number | null;
}

export interface MetricPlot {
  points: MetricPlotPoint[];
  /** Linha suavizada. Segmentos separados quando há buraco na série. */
  path: string;
  /**
   * Mesma linha fechada contra a base — é o que recebe o preenchimento em
   * gradiente das referências. Vem separada da linha porque um `fill` aplicado
   * ao próprio traço fecharia os buracos da série, inventando dado que não
   * existe.
   */
  area: string;
  /** Último ponto com valor suavizado, para o marcador de "hoje". */
  head: MetricPlotPoint | null;
  box: typeof BOX;
}

export function metricGeometry(series: MetricSeries): MetricPlot {
  const values = series.points.flatMap((point) =>
    point.smoothed === null ? [point.raw] : [point.raw, point.smoothed],
  );
  if (!values.length) return { points: [], path: '', area: '', head: null, box: BOX };

  const min = Math.min(...values),
    range = Math.max(1, Math.max(...values) - min);
  const start = Date.parse(series.points[0]!.at),
    duration = Math.max(1, Date.parse(series.points.at(-1)!.at) - start);
  const plot = (value: number) => BOX.baseline - ((value - min) / range) * BOX.plotHeight;

  const points: MetricPlotPoint[] = series.points.map((point) => ({
    x: BOX.inset + ((Date.parse(point.at) - start) / duration) * (BOX.width - BOX.inset * 2),
    rawY: plot(point.raw),
    smoothY: point.smoothed === null ? null : plot(point.smoothed),
  }));

  // Um percurso por trecho contínuo. `segment` acumula o trecho corrente para
  // que a área possa ser fechada no ponto em que ele termina, e não no fim da
  // série inteira.
  let path = '';
  let area = '';
  let segment: MetricPlotPoint[] = [];

  const closeSegment = () => {
    if (segment.length < 1) return;
    const first = segment[0]!;
    const last = segment.at(-1)!;
    area +=
      ' M ' +
      first.x +
      ' ' +
      BOX.baseline +
      segment.map((point) => ' L ' + point.x + ' ' + point.smoothY).join('') +
      ' L ' +
      last.x +
      ' ' +
      BOX.baseline +
      ' Z';
    segment = [];
  };

  for (const point of points) {
    if (point.smoothY === null) {
      closeSegment();
      continue;
    }
    path += (segment.length ? ' L ' : ' M ') + point.x + ' ' + point.smoothY;
    segment.push(point);
  }
  closeSegment();

  const head = points.findLast((point) => point.smoothY !== null) ?? null;
  return { points, path, area, head, box: BOX };
}

/**
 * Faixas de toque do gráfico, em porcentagem da largura.
 *
 * Cada faixa cobre a região horizontal **mais próxima** do seu ponto: os cortes
 * ficam no meio do caminho entre pontos vizinhos, e as pontas se estendem até a
 * borda. É o que faz o toque acertar o que o dedo mirou mesmo quando os pontos
 * estão irregulares no tempo — dividir a largura em colunas iguais parece certo
 * até a série ter um buraco de três semanas, e aí o toque seleciona o vizinho.
 *
 * Sai em porcentagem, e não em unidades do viewBox, porque quem recebe é um
 * `<Pressable>` do RN posicionado sobre o SVG, que escala com a tela.
 */
export function touchBands(points: readonly MetricPlotPoint[]): { left: number; width: number }[] {
  if (!points.length) return [];
  const toPercent = (x: number) => (x / BOX.width) * 100;
  if (points.length === 1) return [{ left: 0, width: 100 }];

  return points.map((point, index) => {
    const previous = points[index - 1];
    const next = points[index + 1];
    const start = previous ? toPercent((previous.x + point.x) / 2) : 0;
    const end = next ? toPercent((point.x + next.x) / 2) : 100;
    return { left: start, width: Math.max(0, end - start) };
  });
}
