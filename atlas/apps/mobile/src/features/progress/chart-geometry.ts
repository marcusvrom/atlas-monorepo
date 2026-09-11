import type { MetricSeries } from '@atlas/contracts';
export function metricGeometry(series: MetricSeries) {
  const values = series.points.flatMap((point) =>
    point.smoothed === null ? [point.raw] : [point.raw, point.smoothed],
  );
  if (!values.length) return { points: [], path: '' };
  const min = Math.min(...values),
    range = Math.max(1, Math.max(...values) - min);
  const start = Date.parse(series.points[0]!.at),
    duration = Math.max(1, Date.parse(series.points.at(-1)!.at) - start);
  const points = series.points.map((point) => ({
    x: 8 + ((Date.parse(point.at) - start) / duration) * 284,
    rawY: 132 - ((point.raw - min) / range) * 120,
    smoothY: point.smoothed === null ? null : 132 - ((point.smoothed - min) / range) * 120,
  }));
  let open = false;
  let path = '';
  for (const point of points) {
    if (point.smoothY === null) {
      open = false;
      continue;
    }
    path += (open ? ' L ' : ' M ') + point.x + ' ' + point.smoothY;
    open = true;
  }
  return { points, path };
}
