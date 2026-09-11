import { it, expect } from 'vitest';
import { themes, glass } from '@atlas/design-tokens';
function rgb(hex: string) {
  return [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16));
}
function luminance(values: number[]) {
  return values
    .map((value) => {
      const v = value / 255;
      return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    })
    .reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index]!, 0);
}
function contrast(a: number[], b: number[]) {
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (values[0]! + 0.05) / (values[1]! + 0.05);
}
it('texto primário/secundário/terciário supera 4,5:1 nos extremos do fallback de vidro', () => {
  for (const theme of Object.values(themes))
    for (const variant of Object.values(glass.variant))
      for (const backdrop of [0, 255]) {
        const surface = rgb(theme.surface).map(
          (value) => value * variant.fallbackOpacity + backdrop * (1 - variant.fallbackOpacity),
        );
        for (const text of [theme.textPrimary, theme.textSecondary, theme.textTertiary])
          expect(contrast(rgb(text), surface)).toBeGreaterThanOrEqual(4.5);
      }
});
it('rótulos dos botões mantêm contraste 4,5:1 em repouso e pressionados', () => {
  for (const theme of Object.values(themes))
    for (const background of [theme.brand, theme.brandPressed, theme.danger])
      expect(contrast(rgb(theme.textOnBrand), rgb(background))).toBeGreaterThanOrEqual(4.5);
});
