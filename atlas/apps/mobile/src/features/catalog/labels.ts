import type { Equipment, Difficulty } from '@atlas/contracts';
import { t } from '../../i18n';
export function equipmentLabel(value: Equipment) {
  return t(('equipment_' + value) as Parameters<typeof t>[0]);
}
export function difficultyLabel(value: Difficulty) {
  return t(('difficulty_' + value) as Parameters<typeof t>[0]);
}
