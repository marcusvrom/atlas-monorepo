import { describe, expect, it } from 'vitest';
import { formatWeight } from '../../lib/format';
import { axisTicks, describeSeries, seriesStats, type SeriesPoint } from './chart-summary';

const series: SeriesPoint[] = [
  { at: '2026-07-05T10:00:00.000Z', value: 60 },
  { at: '2026-07-26T10:00:00.000Z', value: 64 },
  { at: '2026-08-16T10:00:00.000Z', value: 62.5 },
  { at: '2026-09-08T10:00:00.000Z', value: 67.5 },
];

const describe_ = (points: SeriesPoint[], label = 'Carga no supino reto') =>
  describeSeries({ label, unit: 'kg', points, format: formatWeight });

describe('estatísticas da série', () => {
  it('extrai extremos e sentido a partir das pontas', () => {
    const stats = seriesStats(series)!;
    expect(stats.count).toBe(4);
    expect(stats.first.value).toBe(60);
    expect(stats.last.value).toBe(67.5);
    expect(stats.max.value).toBe(67.5);
    expect(stats.min.value).toBe(60);
    expect(stats.direction).toBe('up');
  });

  it('ordena por data antes de decidir o sentido', () => {
    const stats = seriesStats([...series].reverse())!;
    expect(stats.first.value).toBe(60);
    expect(stats.direction).toBe('up');
  });

  it('descarta ponto inválido sem derrubar a série inteira', () => {
    const stats = seriesStats([
      ...series,
      { at: 'não é data', value: 999 },
      { at: '2026-09-09T10:00:00.000Z', value: Number.NaN },
    ])!;
    expect(stats.count).toBe(4);
    expect(stats.max.value).toBe(67.5);
  });

  it('devolve nulo — e não zeros — quando não há registro', () => {
    expect(seriesStats([])).toBeNull();
  });
});

describe('alternativa textual do gráfico', () => {
  it('diz o que mede, o período, o sentido e a unidade', () => {
    const text = describe_(series);
    expect(text).toContain('Carga no supino reto.');
    expect(text).toContain('Período de 5 jul a 8 set.');
    expect(text).toContain('Aumento de 60 kg para 67,5 kg.');
  });

  it('não repete o extremo que já é uma das pontas', () => {
    const text = describe_(series);
    expect(text).not.toContain('Maior valor');
    expect(text).not.toContain('Menor valor');
  });

  it('anuncia o pico quando ele está no meio da série', () => {
    const text = describe_([
      { at: '2026-07-05T10:00:00.000Z', value: 60 },
      { at: '2026-08-02T10:00:00.000Z', value: 72 },
      { at: '2026-09-08T10:00:00.000Z', value: 65 },
    ]);
    expect(text).toContain('Maior valor: 72 kg em 2 ago.');
  });

  it('reconhece queda e estabilidade', () => {
    const down = describe_([
      { at: '2026-07-05T10:00:00.000Z', value: 90 },
      { at: '2026-09-08T10:00:00.000Z', value: 84.2 },
    ]);
    expect(down).toContain('Queda de 90 kg para 84,2 kg.');

    const flat = describe_([
      { at: '2026-07-05T10:00:00.000Z', value: 80 },
      { at: '2026-09-08T10:00:00.000Z', value: 80 },
    ]);
    expect(flat).toContain('Estável em 80 kg.');
  });

  it('trata registro único sem falar em tendência', () => {
    const text = describe_([{ at: '2026-09-08T10:00:00.000Z', value: 67.5 }]);
    expect(text).toBe('Carga no supino reto. Um único registro: 67,5 kg em 8 set.');
  });

  it('diz que não há registro em vez de descrever um gráfico vazio', () => {
    expect(describe_([])).toBe('Carga no supino reto. Sem registros no período.');
  });

  it('funciona sem unidade', () => {
    const text = describeSeries({
      label: 'Sessões',
      unit: '',
      points: [
        { at: '2026-07-05T10:00:00.000Z', value: 2 },
        { at: '2026-09-08T10:00:00.000Z', value: 5 },
      ],
      format: (value) => String(value),
    });
    expect(text).toContain('Aumento de 2 para 5.');
  });
});

describe('marcações do eixo', () => {
  it('mantém só as pontas em série curta', () => {
    expect(axisTicks(series).map((point) => point.value)).toEqual([60, 67.5]);
  });

  it('acrescenta uma âncora central quando a série é longa', () => {
    const long = Array.from({ length: 9 }, (_, index) => ({
      at: new Date(2026, 6, 1 + index).toISOString(),
      value: index,
    }));
    expect(axisTicks(long).map((point) => point.value)).toEqual([0, 4, 8]);
  });

  it('não inventa eixo para série vazia', () => {
    expect(axisTicks([])).toEqual([]);
  });
});
