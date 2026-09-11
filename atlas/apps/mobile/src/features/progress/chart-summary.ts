import { formatShortDate } from '../../lib/format';
import { t } from '../../i18n';

/**
 * Alternativa textual de um gráfico.
 *
 * Um SVG é invisível para leitor de tela e, na prática, também para quem
 * enxerga bem mas está olhando o celular no meio de uma série. Este módulo
 * transforma uma série em uma frase que carrega o que o desenho carrega:
 * **o que** está sendo medido, **em que período**, **para onde foi**, e quais
 * foram os extremos.
 *
 * É puro e sem React de propósito — a frase que o leitor de tela ouve é a mesma
 * que o teste verifica, e não uma reconstrução aproximada dela.
 *
 * O arredondamento fica com quem chama (`format`), não aqui: a mesma série
 * aparece como carga num lugar e como peso corporal em outro, e a descrição
 * precisa dizer exatamente o número que está desenhado na tela.
 */

export interface SeriesPoint {
  at: string;
  value: number;
}

export interface SeriesStats {
  count: number;
  first: SeriesPoint;
  last: SeriesPoint;
  max: SeriesPoint;
  min: SeriesPoint;
  /** Comparação entre a primeira e a última leitura, não da linha suavizada. */
  direction: 'up' | 'down' | 'flat';
}

/**
 * Estatísticas de leitura da série. Devolve `null` quando não há ponto algum —
 * um gráfico sem dado não é um gráfico com zeros, e a diferença precisa chegar
 * intacta na camada de cima.
 */
export function seriesStats(points: readonly SeriesPoint[]): SeriesStats | null {
  const usable = points.filter(
    (point) => Number.isFinite(point.value) && Number.isFinite(Date.parse(point.at)),
  );
  if (!usable.length) return null;

  const ordered = [...usable].sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
  const first = ordered[0]!;
  const last = ordered.at(-1)!;
  let max = first;
  let min = first;
  for (const point of ordered) {
    if (point.value > max.value) max = point;
    if (point.value < min.value) min = point;
  }

  return {
    count: ordered.length,
    first,
    last,
    max,
    min,
    direction: last.value > first.value ? 'up' : last.value < first.value ? 'down' : 'flat',
  };
}

function fill(key: Parameters<typeof t>[0], values: Record<string, string>): string {
  return Object.entries(values).reduce(
    (text, [token, value]) => text.replace('{' + token + '}', value),
    t(key),
  );
}

/**
 * Frase completa que descreve o gráfico, no formato:
 *
 * > "Carga no supino reto. Período de 5 jul a 8 set. Aumento de 60 para 67,5 kg.
 * >  Maior valor: 67,5 kg em 8 set."
 *
 * Os extremos só entram quando acrescentam algo: numa série que só sobe, o
 * maior valor **é** o último e repeti-lo faz o leitor de tela ouvir o mesmo
 * número três vezes seguidas.
 */
export function describeSeries({
  label,
  unit,
  points,
  format,
}: {
  /** O que está sendo medido. Vira a primeira frase. */
  label: string;
  /** Unidade já no idioma da tela ("kg", "%", "min"). Vazia quando não há. */
  unit: string;
  points: readonly SeriesPoint[];
  /** Mesma função que imprime o número no gráfico. */
  format: (value: number) => string;
}): string {
  const stats = seriesStats(points);
  const withUnit = (value: number) => (unit ? format(value) + ' ' + unit : format(value));

  if (!stats) return label + '. ' + t('chartSummaryEmpty');

  if (stats.count === 1) {
    return (
      label +
      '. ' +
      fill('chartSummarySingle', {
        value: withUnit(stats.first.value),
        date: formatShortDate(stats.first.at),
      })
    );
  }

  const parts = [
    label + '.',
    fill('chartSummaryRange', {
      from: formatShortDate(stats.first.at),
      to: formatShortDate(stats.last.at),
    }),
    stats.direction === 'flat'
      ? fill('chartSummaryFlat', { value: withUnit(stats.last.value) })
      : fill(stats.direction === 'up' ? 'chartSummaryRise' : 'chartSummaryFall', {
          from: withUnit(stats.first.value),
          to: withUnit(stats.last.value),
        }),
  ];

  const extremeIsEndpoint = (point: SeriesPoint) =>
    point.at === stats.first.at || point.at === stats.last.at;

  if (!extremeIsEndpoint(stats.max)) {
    parts.push(
      fill('chartSummaryMax', {
        value: withUnit(stats.max.value),
        date: formatShortDate(stats.max.at),
      }),
    );
  }
  if (!extremeIsEndpoint(stats.min) && stats.min.value !== stats.max.value) {
    parts.push(
      fill('chartSummaryMin', {
        value: withUnit(stats.min.value),
        date: formatShortDate(stats.min.at),
      }),
    );
  }

  return parts.join(' ');
}

/**
 * Rótulos do eixo de tempo: primeiro, último e — só quando há espaço real —
 * um do meio.
 *
 * Menos marcação é uma escolha de legibilidade, não economia: sete datas
 * empilhadas num eixo de 300 pt se sobrepõem, e o usuário lê "borrão" em vez de
 * data. Três âncoras bastam para situar a série no tempo.
 */
export function axisTicks(points: readonly SeriesPoint[]): SeriesPoint[] {
  const stats = seriesStats(points);
  if (!stats) return [];
  if (stats.count === 1) return [stats.first];

  const ordered = [...points]
    .filter((point) => Number.isFinite(Date.parse(point.at)))
    .sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
  if (ordered.length < 5) return [ordered[0]!, ordered.at(-1)!];

  return [ordered[0]!, ordered[Math.floor((ordered.length - 1) / 2)]!, ordered.at(-1)!];
}
