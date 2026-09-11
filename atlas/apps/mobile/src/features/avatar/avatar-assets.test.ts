import { readFileSync } from 'node:fs';
import { it, expect } from 'vitest';
import { AvatarConfig } from '@atlas/contracts';
import { avatarCategories, avatarItems, itemIndex } from './avatar-assets';
it('oferece a coleção completa e mantém premium como requisito de entitlement', () => {
  expect(avatarCategories.map((category) => avatarItems(category).length)).toEqual([
    4, 6, 8, 6, 8, 6, 6, 6,
  ]);
  expect(avatarItems('hair').at(-1)?.requiredFeature).toBe('premiumAvatarItems');
  expect(avatarItems('skinTone').every((item) => item.requiredFeature === null)).toBe(true);
});
it('resolve configurações antigas com fallback estável e assets menores que 150 KB', () => {
  const config = AvatarConfig.parse({
    base: 'legacy',
    skinTone: 'legacy',
    hair: 'legacy',
    face: 'legacy',
    outfit: 'legacy',
    accessory: null,
    frame: null,
    background: 'legacy',
  });
  expect(itemIndex(config, 'base')).toBe(0);
  expect(
    readFileSync('apps/mobile/src/features/avatar/avatar-assets.ts').byteLength +
      readFileSync('apps/mobile/src/features/avatar/Avatar.tsx').byteLength,
  ).toBeLessThan(150 * 1024);
});
