export type GlassCapability = 'native' | 'blurFallback' | 'solid';
export function resolveCapability(
  requested: GlassCapability,
  reduceTransparency: boolean,
  available: boolean,
): GlassCapability {
  if (reduceTransparency) return 'solid';
  if (requested !== 'native') return requested;
  return available ? 'native' : 'blurFallback';
}
