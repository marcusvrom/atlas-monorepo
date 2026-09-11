export function sparklinePath(
  values: readonly number[],
  width: number,
  height: number,
  inset: number,
): string {
  const points = values.filter(Number.isFinite);
  if (points.length < 2) return '';
  const min = Math.min(...points),
    max = Math.max(...points);
  return points
    .map((value, index) => {
      const x = inset + (index / (points.length - 1)) * (width - inset * 2);
      const y =
        max === min
          ? height / 2
          : height - inset - ((value - min) / (max - min)) * (height - inset * 2);
      return (index === 0 ? 'M' : 'L') + x + ' ' + y;
    })
    .join(' ');
}
