export function nextStep(value: number, delta: number, min: number, max: number): number {
  if (![value, delta, min, max].every(Number.isFinite) || min > max) return value;
  return Math.min(max, Math.max(min, Math.round((value + delta) * 1e6) / 1e6));
}
