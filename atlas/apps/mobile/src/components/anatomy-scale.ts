import { heatmapScale } from '@atlas/design-tokens';
import { t } from '../i18n';
export function intensityLevel(value: number) {
  if (!Number.isFinite(value) || value <= 0) return 0;
  if (value < 0.34) return 1;
  if (value < 0.67) return 2;
  return 3;
}
export function describeIntensity(value: number) {
  return [t('anatomyNone'), t('anatomyLow'), t('anatomyMedium'), t('anatomyHigh')][
    intensityLevel(value)
  ]!;
}
export function intensityColor(value: number, base: string) {
  const level = intensityLevel(value);
  return level === 0 ? base : heatmapScale[level === 3 ? 4 : level]!.color;
}
