import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { AvatarConfig } from '@atlas/contracts';
import {
  accessoryPaths,
  avatarCategories,
  avatarFaces,
  avatarItems,
  colorFor,
  hairColors,
  itemIndex,
  outfitPaths,
  paletteFor,
} from './avatar-assets';

const legacy = AvatarConfig.parse({
  base: 'legacy',
  skinTone: 'legacy',
  hair: 'legacy',
  face: 'legacy',
  outfit: 'legacy',
  accessory: null,
  frame: null,
  background: 'legacy',
});

describe('catálogo de peças', () => {
  it('oferece a coleção completa e mantém premium como requisito de entitlement', () => {
    expect(avatarCategories.map((category) => avatarItems(category).length)).toEqual([
      6, 4, 6, 6, 4, 6, 6, 6,
    ]);
    expect(avatarItems('hair').at(-1)?.requiredFeature).toBe('premiumAvatarItems');
  });

  it('nunca cobra por tom de pele', () => {
    expect(avatarItems('skinTone').every((item) => item.requiredFeature === null)).toBe(true);
  });

  it('dá a "nenhum" um item próprio só onde o contrato aceita nulo', () => {
    for (const category of avatarCategories) {
      const none = avatarItems(category).filter((item) => item.isNone);
      expect(none.length).toBe(category === 'accessory' || category === 'frame' ? 1 : 0);
    }
  });

  it('não oferece peça vazia disfarçada de acessório', () => {
    // A regressão que motivou a refatoração: accessoryPaths[0] era ''.
    expect(accessoryPaths.every((path) => path.length > 0)).toBe(true);
    expect(accessoryPaths).toHaveLength(avatarItems('accessory').length - 1);
  });

  it('tem uma forma real por roupa, não a mesma repetida em cores', () => {
    expect(new Set(outfitPaths).size).toBe(outfitPaths.length);
  });

  it('descreve todo rosto oferecido', () => {
    expect(avatarFaces).toHaveLength(avatarItems('face').length);
  });

  it('resolve configuração antiga com fallback estável', () => {
    expect(itemIndex(legacy, 'base')).toBe(0);
  });

  it('mantém os assets dentro do orçamento de bundle', () => {
    expect(
      readFileSync('apps/mobile/src/features/avatar/avatar-assets.ts').byteLength +
        readFileSync('apps/mobile/src/features/avatar/Avatar.tsx').byteLength,
    ).toBeLessThan(150 * 1024);
  });
});

describe('cor independente da forma', () => {
  it('usa a cor derivada da peça quando não há escolha explícita', () => {
    // É o comportamento anterior à existência do campo: avatar já salvo
    // renderiza exatamente igual depois da migração.
    const config = AvatarConfig.parse({ ...legacy, hair: 'hair-2' });
    expect(colorFor(config, 'hair')).toBe(hairColors[2]);
  });

  it('respeita a escolha explícita sem mexer na forma', () => {
    const config = AvatarConfig.parse({ ...legacy, hair: 'hair-2', hairColor: hairColors[5] });
    expect(colorFor(config, 'hair')).toBe(hairColors[5]);
    expect(itemIndex(config, 'hair')).toBe(2);
  });

  it('ignora cor fora da paleta em vez de pintar com valor arbitrário', () => {
    const config = AvatarConfig.parse({ ...legacy, hair: 'hair-1', hairColor: '#ABCDEF' });
    expect(colorFor(config, 'hair')).toBe(hairColors[1]);
  });

  it('nunca sai da paleta, qualquer que seja o índice da peça', () => {
    for (const category of ['hair', 'outfit', 'background'] as const) {
      for (const item of avatarItems(category)) {
        const config = AvatarConfig.parse({ ...legacy, [category]: item.id });
        expect(paletteFor[category]).toContain(colorFor(config, category));
      }
    }
  });
});
