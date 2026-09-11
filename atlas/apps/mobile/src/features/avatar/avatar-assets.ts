import { palette, avatarSkinTones } from '@atlas/design-tokens';
import type { AvatarConfig, Feature } from '@atlas/contracts';
export const avatarCategories = [
  'base',
  'skinTone',
  'hair',
  'face',
  'outfit',
  'accessory',
  'frame',
  'background',
] as const;
export type AvatarCategory = (typeof avatarCategories)[number];
const counts = {
  base: 4,
  skinTone: 6,
  hair: 8,
  face: 6,
  outfit: 8,
  accessory: 6,
  frame: 6,
  background: 6,
};
export function avatarItems(category: AvatarCategory) {
  return Array.from({ length: counts[category] }, (_, index) => ({
    id: category + '-' + index,
    index,
    requiredFeature: (index >= counts[category] - 2 && category !== 'skinTone'
      ? 'premiumAvatarItems'
      : null) as Feature | null,
  }));
}
export function itemIndex(config: AvatarConfig, category: AvatarCategory) {
  const value = config[category];
  return avatarItems(category).find((item) => item.id === value)?.index ?? 0;
}
export const avatarColors = [
  palette.brand500,
  palette.success,
  palette.warning,
  palette.info,
  palette.ink400,
  palette.brand700,
  palette.danger,
  palette.ink200,
];
export const skinColors = avatarSkinTones;
export const basePaths = [
  'M 34 118 Q 34 80 64 80 Q 94 80 94 118 Z',
  'M 26 118 Q 28 80 64 80 Q 100 80 102 118 Z',
  'M 38 118 Q 30 84 64 80 Q 98 84 90 118 Z',
  'M 30 118 Q 40 84 64 82 Q 88 84 98 118 Z',
];
export const hairPaths = [
  'M 41 48 Q 37 17 64 18 Q 91 17 87 48 L 80 34 Q 65 38 49 32 Z',
  'M 39 73 L 38 36 Q 43 14 64 16 Q 90 17 90 40 L 91 73 L 82 70 L 81 34 Q 66 44 46 34 L 46 72 Z',
  'M 41 44 Q 35 31 43 27 Q 39 17 51 20 Q 52 8 64 17 Q 77 7 79 21 Q 94 18 90 33 L 85 44 L 79 34 L 47 35 Z',
  'M 40 40 Q 43 18 62 19 Q 84 18 89 42 Q 68 24 40 40 Z',
  'M 40 51 L 39 25 Q 53 12 74 18 L 90 34 L 83 47 L 78 30 L 50 31 Z',
  'M 39 50 Q 38 15 64 18 Q 92 13 91 52 L 82 41 Q 57 48 48 30 L 46 53 Z',
  'M 41 40 Q 38 19 57 20 Q 67 9 80 21 L 91 38 L 80 34 L 67 27 L 51 38 Z',
  'M 40 67 Q 27 18 58 16 Q 100 12 90 69 L 84 63 L 83 33 Q 60 43 46 31 L 46 64 Z',
];
export const mouthPaths = [
  'M 55 66 Q 64 73 73 66',
  'M 56 68 L 72 68',
  'M 56 65 Q 64 78 72 65 Z',
  'M 57 67 Q 64 70 71 66',
  'M 57 68 Q 64 64 71 68',
  'M 55 64 Q 64 73 73 64',
];
export const outfitPaths = Array.from({ length: 8 }, (_, i) =>
  i % 2
    ? 'M 26 118 L 35 92 L 51 83 Q 64 101 77 83 L 93 92 L 102 118 Z'
    : 'M 34 118 L 41 88 L 52 82 Q 64 94 76 82 L 87 88 L 94 118 Z',
);
export const accessoryPaths = [
  '',
  'M 44 48 L 60 48 L 60 58 L 44 58 Z M 68 48 L 84 48 L 84 58 L 68 58 Z M 60 52 L 68 52',
  'M 53 84 Q 64 106 75 84',
  'M 38 49 L 38 63 M 90 49 L 90 63',
  'M 47 90 L 47 112 L 81 112 L 81 90',
  'M 53 37 L 75 37 L 75 43 L 53 43 Z',
];
