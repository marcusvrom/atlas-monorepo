import { palette, avatarSkinTones } from '@atlas/design-tokens';
import type { AvatarConfig, Feature } from '@atlas/contracts';
import { accessories, avatarFaces, basePaths, hairStyles, outfits } from './avatar-parts';

export * from './avatar-parts';
export * from './avatar-presets';

/**
 * ATL-AVT-003 — catálogo de peças.
 *
 * A geometria vive em `avatar-parts.ts` (sem React, para poder ser pré-
 * visualizada fora do app); aqui ficam os itens, as paletas e as regras de
 * direito.
 *
 * **Modelo de direito:** montar o avatar peça por peça é Pro. O usuário
 * gratuito escolhe entre dois modelos prontos (ver `avatar-presets.ts`) e pode
 * trocar o tom de pele à vontade — cor de pele nunca fica atrás de paywall.
 */
export const avatarCategories = [
  'skinTone',
  'base',
  'hair',
  'face',
  'outfit',
  'accessory',
  'background',
  'frame',
] as const;
export type AvatarCategory = (typeof avatarCategories)[number];

/** Categorias em que a cor é escolhida separadamente da forma. */
export const colorableCategories = ['hair', 'outfit', 'background'] as const;
export type ColorableCategory = (typeof colorableCategories)[number];

/** A única categoria que o plano gratuito pode alterar livremente. */
export const FREE_CATEGORY: AvatarCategory = 'skinTone';

export interface AvatarItem {
  id: string;
  index: number;
  /** `null` quando a peça é gratuita. */
  requiredFeature: Feature | null;
  /** `true` na opção "sem peça" (acessório e moldura). */
  isNone: boolean;
}

/** Quantas peças cada categoria oferece. Derivado da geometria real. */
const counts: Record<AvatarCategory, number> = {
  skinTone: avatarSkinTones.length,
  base: basePaths.length,
  hair: hairStyles.length,
  face: avatarFaces.length,
  outfit: outfits.length,
  accessory: accessories.length,
  background: 6,
  frame: 5,
};

/** Categorias que aceitam "nenhum" — o contrato já as declara anuláveis. */
const nullable: readonly AvatarCategory[] = ['accessory', 'frame'];

export function avatarItems(category: AvatarCategory): AvatarItem[] {
  const requiredFeature: Feature | null = category === FREE_CATEGORY ? null : 'premiumAvatarItems';
  return Array.from({ length: counts[category] }, (_, index) => ({
    id: category + '-' + index,
    index,
    requiredFeature,
    isNone: false,
  })).concat(
    nullable.includes(category) ? [{ id: '', index: -1, requiredFeature, isNone: true }] : [],
  );
}

/**
 * Índice da peça escolhida, com fallback em 0. O fallback é o que mantém
 * avatares antigos (ids de outra numeração) renderizáveis em vez de quebrarem.
 */
export function itemIndex(config: AvatarConfig, category: AvatarCategory): number {
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

/** Tons de cabelo — escala própria, porque roxo de marca não serve de cabelo. */
export const hairColors = [
  '#2B2119',
  '#5A3A22',
  '#8C5A2B',
  '#C79A4B',
  '#E0D3C0',
  '#9B9B9B',
  palette.brand500,
  palette.danger,
];

/** Fundos: tons profundos das pranchas de marca, para o retrato saltar. */
export const backgroundColors = [
  '#4A306D',
  '#7A2F6A',
  '#501F5B',
  '#29264C',
  '#1D0F30',
  '#2F4C86',
  '#6E3482',
  '#2A1140',
];

export const skinColors = avatarSkinTones;

/** Paleta oferecida por categoria colorível. */
export const paletteFor: Record<ColorableCategory, readonly string[]> = {
  hair: hairColors,
  outfit: avatarColors,
  background: backgroundColors,
};

/**
 * Cor efetiva de uma categoria colorível: a escolha explícita quando existe,
 * senão a cor derivada do índice da peça — que é exatamente como o avatar se
 * comportava antes do campo existir. É o que faz um avatar já salvo continuar
 * idêntico depois da migração.
 */
export function colorFor(config: AvatarConfig, category: ColorableCategory): string {
  const explicit = config[`${category}Color` as const];
  const options = paletteFor[category];
  if (explicit && options.includes(explicit)) return explicit;
  return options[itemIndex(config, category) % options.length]!;
}

/** Escurece um hex — sombra do pescoço, contorno da boca, forro da jaqueta. */
export function shade(hex: string, factor = 0.78): string {
  const parsed = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!parsed) return hex;
  const value = parseInt(parsed[1]!, 16);
  const channels = [(value >> 16) & 255, (value >> 8) & 255, value & 255].map((channel) =>
    Math.max(0, Math.min(255, Math.round(channel * factor))),
  );
  return '#' + channels.map((c) => c.toString(16).padStart(2, '0')).join('');
}
