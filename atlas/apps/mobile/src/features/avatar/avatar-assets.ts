import { palette, avatarSkinTones } from '@atlas/design-tokens';
import type { AvatarConfig, Feature } from '@atlas/contracts';

/**
 * ATL-AVT-002 — catálogo de peças do avatar.
 *
 * Três problemas da versão anterior, todos resolvidos aqui:
 *
 * 1. **Cor grudada na forma.** `outfit` tinha 8 itens, mas os caminhos eram
 *    `i % 2` — duas formas repetidas em quatro cores. Escolher a cor obrigava a
 *    trocar a forma. Agora a forma é a peça e a cor é um campo próprio
 *    (`hairColor`, `outfitColor`, `backgroundColor` no contrato).
 * 2. **Peça vazia como opção.** `accessoryPaths[0]` era `''`: a opção "sem
 *    acessório" existia disfarçada de acessório, e renderizava um `<Path d="">`.
 *    Agora "sem acessório" é `null`, que é o que o contrato já dizia.
 * 3. **Rosto por número mágico.** Olhos e boca saíam de `face === 1 ? 3 : 2`
 *    espalhado no componente. Agora cada rosto é um registro explícito.
 *
 * A ordem de `avatarCategories` é a ordem em que as abas aparecem no editor:
 * do que mais muda a silhueta para o que só decora.
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

export interface AvatarItem {
  id: string;
  index: number;
  /** `null` quando a peça é gratuita. */
  requiredFeature: Feature | null;
  /** `true` na opção "sem peça" (acessório e moldura). */
  isNone: boolean;
}

/**
 * Quantas peças cada categoria oferece. As duas últimas de cada categoria são
 * premium, **menos** tom de pele: cor de pele nunca fica atrás de paywall.
 */
const counts: Record<AvatarCategory, number> = {
  skinTone: 6,
  base: 4,
  hair: 6,
  face: 6,
  outfit: 4,
  accessory: 5,
  background: 6,
  frame: 5,
};

/** Categorias que aceitam "nenhum" — o contrato já as declara anuláveis. */
const nullable: readonly AvatarCategory[] = ['accessory', 'frame'];

export function avatarItems(category: AvatarCategory): AvatarItem[] {
  const total = counts[category];
  const premiumFrom = category === 'skinTone' ? total : total - 2;
  return Array.from({ length: total }, (_, index) => ({
    id: category + '-' + index,
    index,
    requiredFeature: (index >= premiumFrom ? 'premiumAvatarItems' : null) as Feature | null,
    isNone: false,
  })).concat(
    nullable.includes(category) ? [{ id: '', index: -1, requiredFeature: null, isNone: true }] : [],
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

export const skinColors = avatarSkinTones;

/** Paleta oferecida por categoria colorível. */
export const paletteFor: Record<ColorableCategory, readonly string[]> = {
  hair: hairColors,
  outfit: avatarColors,
  background: avatarColors,
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
  if (explicit) {
    const found = options.indexOf(explicit);
    if (found >= 0) return explicit;
  }
  return options[itemIndex(config, category) % options.length]!;
}

// ── Formas ──────────────────────────────────────────────────────────────────

/** Ombros/tronco. Muda a silhueta, por isso é a primeira escolha de forma. */
export const basePaths = [
  'M 34 118 Q 34 80 64 80 Q 94 80 94 118 Z',
  'M 26 118 Q 28 80 64 80 Q 100 80 102 118 Z',
  'M 38 118 Q 30 84 64 80 Q 98 84 90 118 Z',
  'M 30 118 Q 40 84 64 82 Q 88 84 98 118 Z',
];

export const hairPaths = [
  // Curto
  'M 41 48 Q 37 17 64 18 Q 91 17 87 48 L 80 34 Q 65 38 49 32 Z',
  // Longo
  'M 39 73 L 38 36 Q 43 14 64 16 Q 90 17 90 40 L 91 73 L 82 70 L 81 34 Q 66 44 46 34 L 46 72 Z',
  // Cacheado
  'M 41 44 Q 35 31 43 27 Q 39 17 51 20 Q 52 8 64 17 Q 77 7 79 21 Q 94 18 90 33 L 85 44 L 79 34 L 47 35 Z',
  // Raspado
  'M 40 40 Q 43 18 62 19 Q 84 18 89 42 Q 68 24 40 40 Z',
  // Com franja
  'M 40 51 L 39 25 Q 53 12 74 18 L 90 34 L 83 47 L 78 30 L 50 31 Z',
  // Volumoso
  'M 40 67 Q 27 18 58 16 Q 100 12 90 69 L 84 63 L 83 33 Q 60 43 46 31 L 46 64 Z',
];

/**
 * Rostos. Cada entrada descreve **tudo** que o rosto muda — antes os olhos
 * saíam de condicionais soltas no componente (`face === 1 ? 3 : 2`), o que
 * tornava impossível acrescentar um rosto sem editar o render.
 */
export interface AvatarFace {
  /** Raio horizontal e vertical do olho. */
  eyeRx: number;
  eyeRy: number;
  mouth: string;
  /** Boca preenchida (sorriso aberto) em vez de só traço. */
  mouthFilled: boolean;
}

export const avatarFaces: AvatarFace[] = [
  { eyeRx: 2, eyeRy: 2, mouth: 'M 55 66 Q 64 73 73 66', mouthFilled: false },
  { eyeRx: 3, eyeRy: 2, mouth: 'M 56 68 L 72 68', mouthFilled: false },
  { eyeRx: 2, eyeRy: 2, mouth: 'M 55 65 Q 64 78 73 65 Z', mouthFilled: true },
  { eyeRx: 2.4, eyeRy: 2.4, mouth: 'M 57 67 Q 64 70 71 66', mouthFilled: false },
  { eyeRx: 2, eyeRy: 1, mouth: 'M 57 68 Q 64 64 71 68', mouthFilled: false },
  { eyeRx: 2.6, eyeRy: 2, mouth: 'M 55 64 Q 64 73 73 64', mouthFilled: false },
];

/** Quatro formas de roupa de verdade — a cor é escolhida à parte. */
export const outfitPaths = [
  // Camiseta
  'M 34 118 L 41 88 L 52 82 Q 64 94 76 82 L 87 88 L 94 118 Z',
  // Regata
  'M 38 118 L 44 90 L 54 82 Q 64 92 74 82 L 84 90 L 90 118 Z M 54 82 L 57 96 M 74 82 L 71 96',
  // Moletom
  'M 26 118 L 35 92 L 51 83 Q 64 101 77 83 L 93 92 L 102 118 Z',
  // Jaqueta aberta
  'M 30 118 L 38 90 L 52 82 L 60 118 Z M 98 118 L 90 90 L 76 82 L 68 118 Z',
];

/**
 * Acessórios. Note que **não há** entrada vazia: "sem acessório" é `null` no
 * contrato e um swatch próprio no editor, não um caminho de string vazia.
 */
export const accessoryPaths = [
  // Óculos
  'M 44 48 L 60 48 L 60 58 L 44 58 Z M 68 48 L 84 48 L 84 58 L 68 58 Z M 60 52 L 68 52',
  // Gargantilha
  'M 53 84 Q 64 106 75 84',
  // Brincos
  'M 38 49 L 38 63 M 90 49 L 90 63',
  // Colete
  'M 47 90 L 47 112 L 81 112 L 81 90',
  // Bandana
  'M 53 37 L 75 37 L 75 43 L 53 43 Z',
];
