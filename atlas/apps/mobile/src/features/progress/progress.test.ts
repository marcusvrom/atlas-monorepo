import { it, expect } from 'vitest';
import { MetricSeries } from '@atlas/contracts';
import { progressOrder } from './progress-order';
import { metricGeometry } from './chart-geometry';
it('muda a prioridade das seções com o objetivo', () => {
  expect(progressOrder('hypertrophy')[0]).toBe('volume');
  expect(progressOrder('fatLoss')[0]).toBe('composition');
  expect(progressOrder('strength')[0]).toBe('strength');
  expect(progressOrder('rehabilitation')[0]).toBe('rehabilitation');
});
it('mantém 14 semanas de pontos crus e uma linha suavizada independente', () => {
  const series = MetricSeries.parse({
    metric: 'weight',
    unit: 'kg',
    trendPerWeek: null,
    points: Array.from({ length: 98 }, (_, index) => ({
      at: new Date(Date.UTC(2026, 0, 1 + index)).toISOString(),
      raw: 70 + (index % 3),
      smoothed: 71,
    })),
  });
  const plot = metricGeometry(series);
  expect(plot.points).toHaveLength(98);
  expect(new Set(plot.points.map((point) => point.smoothY)).size).toBe(1);
  expect(new Set(plot.points.map((point) => point.rawY)).size).toBe(3);
  expect(plot.path).not.toContain('NaN');
  expect(plot.area).not.toContain('NaN');
  expect(plot.head?.x).toBe(plot.points.at(-1)!.x);
});
it('fecha a área em cada trecho contínuo, sem atravessar buracos da série', () => {
  const series = MetricSeries.parse({
    metric: 'weight',
    unit: 'kg',
    trendPerWeek: null,
    points: [
      { at: '2026-01-01T00:00:00.000Z', raw: 70, smoothed: 70 },
      { at: '2026-01-02T00:00:00.000Z', raw: 71, smoothed: 71 },
      { at: '2026-01-03T00:00:00.000Z', raw: 72, smoothed: null },
      { at: '2026-01-04T00:00:00.000Z', raw: 73, smoothed: 73 },
      { at: '2026-01-05T00:00:00.000Z', raw: 74, smoothed: 74 },
    ],
  });
  const plot = metricGeometry(series);
  // Dois trechos ⇒ dois subcaminhos fechados; a linha também quebra em dois "M".
  expect(plot.area.match(/Z/g)).toHaveLength(2);
  expect(plot.path.match(/M/g)).toHaveLength(2);
});
it('histórico vazio não produz desenho inválido', () => {
  expect(
    metricGeometry(
      MetricSeries.parse({ metric: 'weight', unit: 'kg', trendPerWeek: null, points: [] }),
    ),
  ).toMatchObject({ points: [], path: '', area: '', head: null });
});
