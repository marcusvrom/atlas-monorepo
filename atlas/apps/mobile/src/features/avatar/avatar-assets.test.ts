import { describe, it, expect } from 'vitest';
import { AvatarConfig } from '@atlas/contracts';
import {
  FREE_CATEGORY,
  PRESET_FIELDS,
  accessories,
  avatarCategories,
  avatarFaces,
  avatarItems,
  avatarPresets,
  colorFor,
  freePresets,
  hairColors,
  hairStyles,
  isAvatarAllowed,
  itemIndex,
  outfits,
  paletteFor,
  shade,
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

const asConfig = (preset: (typeof avatarPresets)[number]) =>
  AvatarConfig.parse({ ...preset.config, photoUri: null });

describe('catálogo de peças', () => {
  it('deriva a contagem de itens da geometria, sem número solto', () => {
    expect(avatarItems('hair')).toHaveLength(hairStyles.length);
    expect(avatarItems('face')).toHaveLength(avatarFaces.length);
    expect(avatarItems('outfit')).toHaveLength(outfits.length);
    // Acessório e moldura ganham o item "nenhum" além das peças.
    expect(avatarItems('accessory')).toHaveLength(accessories.length + 1);
  });

  it('dá a "nenhum" um item próprio só onde o contrato aceita nulo', () => {
    for (const category of avatarCategories) {
      const none = avatarItems(category).filter((item) => item.isNone);
      expect(none).toHaveLength(category === 'accessory' || category === 'frame' ? 1 : 0);
    }
  });

  it('resolve configuração antiga com fallback estável', () => {
    expect(itemIndex(legacy, 'base')).toBe(0);
  });

  it('descreve todo rosto e cabelo oferecido', () => {
    expect(avatarItems('face').every((i) => avatarFaces[i.index] !== undefined)).toBe(true);
    expect(avatarItems('hair').every((i) => hairStyles[i.index] !== undefined)).toBe(true);
  });

  it('escurece cor sem sair da faixa, e devolve a entrada quando não é hex', () => {
    expect(shade('#FFFFFF', 0.5)).toBe('#808080');
    expect(shade('#000000')).toBe('#000000');
    expect(shade('rgba(0,0,0,1)')).toBe('rgba(0,0,0,1)');
  });
});

describe('direito de uso', () => {
  it('oferece exatamente dois modelos gratuitos', () => {
    expect(freePresets).toHaveLength(2);
  });

  it('tem um modelo gratuito feminino e um masculino', () => {
    expect(freePresets.map((preset) => preset.gender).sort()).toEqual(['feminine', 'masculine']);
  });

  it('nunca cobra por tom de pele', () => {
    expect(FREE_CATEGORY).toBe('skinTone');
    expect(avatarItems('skinTone').every((item) => item.requiredFeature === null)).toBe(true);
  });

  it('cobra por montar peça a peça em todas as demais categorias', () => {
    for (const category of avatarCategories) {
      if (category === FREE_CATEGORY) continue;
      expect(
        avatarItems(category).every((item) => item.requiredFeature === 'premiumAvatarItems'),
      ).toBe(true);
    }
  });

  it('aceita os dois modelos gratuitos sem assinatura', () => {
    for (const preset of freePresets) {
      expect(isAvatarAllowed(asConfig(preset), false)).toBe(true);
    }
  });

  it('recusa modelo Pro sem assinatura e aceita com', () => {
    const pro = avatarPresets.find((preset) => preset.requiredFeature !== null)!;
    expect(isAvatarAllowed(asConfig(pro), false)).toBe(false);
    expect(isAvatarAllowed(asConfig(pro), true)).toBe(true);
  });

  it('recusa o modelo gratuito com uma peça trocada — o buraco óbvio da regra', () => {
    const tampered = { ...asConfig(freePresets[0]!), hair: 'hair-7' };
    expect(isAvatarAllowed(tampered, false)).toBe(false);
  });

  it('aceita o modelo gratuito com outro tom de pele', () => {
    const recoloured = { ...asConfig(freePresets[1]!), skinTone: 'skinTone-5' };
    expect(isAvatarAllowed(recoloured, false)).toBe(true);
  });

  it('não deixa o tom de pele entrar nos campos travados pelo modelo', () => {
    expect(PRESET_FIELDS).not.toContain('skinTone');
  });

  it('mantém todo modelo apontando para peças que existem', () => {
    for (const preset of avatarPresets) {
      const config = asConfig(preset);
      for (const category of avatarCategories) {
        const value = config[category];
        if (value === null) continue;
        expect(avatarItems(category).some((item) => item.id === value)).toBe(true);
      }
    }
  });
});

describe('cor independente da forma', () => {
  it('usa a cor derivada da peça quando não há escolha explícita', () => {
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
