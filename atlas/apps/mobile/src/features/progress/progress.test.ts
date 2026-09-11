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
});
it('histórico vazio não produz desenho inválido', () => {
  expect(
    metricGeometry(
      MetricSeries.parse({ metric: 'weight', unit: 'kg', trendPerWeek: null, points: [] }),
    ),
  ).toEqual({ points: [], path: '' });
});
