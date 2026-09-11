import { describe, expect, it } from 'vitest';
import type { MetricSeries } from '@atlas/contracts';
import { metricGeometry, touchBands } from './chart-geometry';

function series(points: { at: string; raw: number; smoothed?: number | null }[]): MetricSeries {
  return {
    metric: 'weight',
    unit: 'kg',
    trendPerWeek: null,
    points: points.map((point) => ({
      at: point.at,
      raw: point.raw,
      smoothed: point.smoothed ?? point.raw,
    })),
  } as MetricSeries;
}

describe('faixas de toque do gráfico', () => {
  it('não cria alvo quando não há ponto', () => {
    expect(touchBands([])).toEqual([]);
  });

  it('entrega a largura inteira ao ponto único', () => {
    const plot = metricGeometry(series([{ at: '2026-09-01T10:00:00.000Z', raw: 80 }]));
    expect(touchBands(plot.points)).toEqual([{ left: 0, width: 100 }]);
  });

  it('corta no meio do caminho entre pontos vizinhos', () => {
    const plot = metricGeometry(
      series([
        { at: '2026-09-01T00:00:00.000Z', raw: 80 },
        { at: '2026-09-02T00:00:00.000Z', raw: 81 },
        { at: '2026-09-03T00:00:00.000Z', raw: 82 },
      ]),
    );
    const bands = touchBands(plot.points);
    expect(bands).toHaveLength(3);
    expect(bands[0]!.left).toBe(0);
    expect(bands.at(-1)!.left + bands.at(-1)!.width).toBeCloseTo(100, 5);
    // O corte entre o primeiro e o segundo cai no meio da distância entre eles.
    const midpoint = ((plot.points[0]!.x + plot.points[1]!.x) / 2 / plot.box.width) * 100;
    expect(bands[0]!.width).toBeCloseTo(midpoint, 5);
  });

  it('cobre a largura inteira sem buraco nem sobreposição', () => {
    const plot = metricGeometry(
      series([
        { at: '2026-07-01T00:00:00.000Z', raw: 70 },
        { at: '2026-07-02T00:00:00.000Z', raw: 71 },
        { at: '2026-08-20T00:00:00.000Z', raw: 74 },
        { at: '2026-09-01T00:00:00.000Z', raw: 73 },
      ]),
    );
    const bands = touchBands(plot.points);
    for (let index = 1; index < bands.length; index += 1) {
      expect(bands[index]!.left).toBeCloseTo(bands[index - 1]!.left + bands[index - 1]!.width, 5);
    }
    expect(bands.reduce((total, band) => total + band.width, 0)).toBeCloseTo(100, 5);
  });

  it('dá ao ponto isolado no tempo uma faixa maior que a dos pontos vizinhos', () => {
    const plot = metricGeometry(
      series([
        { at: '2026-07-01T00:00:00.000Z', raw: 70 },
        { at: '2026-07-02T00:00:00.000Z', raw: 71 },
        { at: '2026-09-01T00:00:00.000Z', raw: 73 },
      ]),
    );
    const bands = touchBands(plot.points);
    expect(bands.at(-1)!.width).toBeGreaterThan(bands[1]!.width);
  });
});
