import { coverPalettes, cover, type CoverPaletteName } from '@atlas/design-tokens';

/**
 * ATL-UI-013 — composição determinística da arte de capa.
 *
 * Módulo puro de propósito: toda a decisão visual (qual paleta, onde ficam os
 * focos de luz, qual a inclinação da banda) é função apenas da semente, o que
 * torna a capa testável sem renderizar e — mais importante — **estável**. Uma
 * capa que mudasse a cada render faria a lista piscar ao rolar e quebraria a
 * associação "esta cor é o agachamento" que o usuário constrói sem perceber.
 *
 * A semente é sempre um identificador de domínio já existente (id do exercício,
 * id do plano, código do músculo). Nunca um índice de lista: índice muda quando
 * a lista é filtrada e a capa trocaria de cor sem o dado ter mudado.
 */

export type CoverGlyph =
  | 'dumbbell'
  | 'barbell'
  | 'kettlebell'
  | 'pulse'
  | 'flame'
  | 'rings'
  | 'trophy'
  /** Sem glifo: para capas que já têm um foco próprio por cima (o avatar do
   *  perfil, por exemplo), onde qualquer desenho de fundo vira ruído. */
  | 'none';

/**
 * Rodízio do sorteio. Note que `trophy` fica **de fora**: é um glifo de uso
 * dirigido (paywall, conquista) e cairia fora de contexto num exercício
 * qualquer que tirasse esse índice. Glifo disponível e glifo sorteável são
 * coisas diferentes — acrescentar aqui muda a cara de todas as capas
 * automáticas do app, então a lista cresce com intenção, não por inércia.
 */
export const coverGlyphs: readonly CoverGlyph[] = [
  'dumbbell',
  'barbell',
  'kettlebell',
  'pulse',
  'flame',
  'rings',
];

export interface CoverGlow {
  /** Centro em fração do canvas (0..1). */
  cx: number;
  cy: number;
  /** Raio em fração do canvas. */
  r: number;
}

export interface CoverComposition {
  paletteName: CoverPaletteName;
  /** `[base, meio, luz]` — ver `coverPalettes`. */
  colors: readonly [string, string, string];
  glyph: CoverGlyph;
  /** Dois focos radiais; o segundo é menor e mais frio, dando profundidade. */
  glows: readonly [CoverGlow, CoverGlow];
  /** Inclinação da banda diagonal, em graus. */
  bandAngle: number;
  /** Deslocamento vertical da banda, em fração do canvas. */
  bandOffset: number;
  /** Rotação do glifo, em graus — quebra a simetria entre capas vizinhas. */
  glyphAngle: number;
}

/**
 * FNV-1a de 32 bits. Escolhido por ser curto, sem dependência e com dispersão
 * boa o bastante para strings curtas — ids e códigos de músculo. Não é hash
 * criptográfico e não deve ser usado como tal.
 */
export function hashSeed(seed: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    // Multiplicação por 16777619 em 32 bits sem estourar o double.
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

/** xorshift32 — gerador determinístico para derivar vários valores de um hash. */
function sequence(state: number): () => number {
  let value = state || 1;
  return () => {
    value ^= value << 13;
    value >>>= 0;
    value ^= value >>> 17;
    value ^= value << 5;
    value >>>= 0;
    return value / 0x100000000;
  };
}

/** Interpola `min..max` a partir de um número em 0..1. */
function between(unit: number, min: number, max: number): number {
  return min + unit * (max - min);
}

/**
 * Deriva a composição de uma semente. `glyph` pode ser fixado quando a tela
 * conhece a semântica (o catálogo sabe que é equipamento), senão é sorteado.
 */
export function composeCover(seed: string, glyph?: CoverGlyph): CoverComposition {
  const hash = hashSeed(seed);
  const next = sequence(hash);
  const palette = coverPalettes[hash % coverPalettes.length]!;

  // Primeiro foco no terço superior — é onde a luz "entra" na composição e
  // onde nenhum texto é sobreposto (o scrim ocupa o rodapé).
  const primary: CoverGlow = {
    cx: between(next(), 0.18, 0.78),
    cy: between(next(), 0.1, 0.38),
    r: cover.glowRadius,
  };
  const secondary: CoverGlow = {
    cx: between(next(), 0.22, 0.86),
    cy: between(next(), 0.55, 0.92),
    r: cover.glowRadius * 0.66,
  };

  return {
    paletteName: palette.name,
    colors: palette.colors,
    glyph: glyph ?? coverGlyphs[hash % coverGlyphs.length]!,
    glows: [primary, secondary],
    bandAngle: Math.round(between(next(), -34, -8)),
    bandOffset: between(next(), 0.3, 0.68),
    glyphAngle: Math.round(between(next(), -18, 18)),
  };
}

/**
 * Traços dos glifos, em um viewBox de 48×48, desenhados a traço (não
 * preenchidos): a linha grossa sobrevive à opacidade baixa do fundo, enquanto
 * uma silhueta preenchida viraria uma mancha. Mesma linguagem dos ícones.
 */
export const coverGlyphPaths: Record<CoverGlyph, readonly string[]> = {
  dumbbell: ['M16 24h16', 'M11 17v14', 'M37 17v14', 'M6 20.5v7', 'M42 20.5v7'],
  barbell: ['M4 24h40', 'M14 17v14', 'M19 13.5v21', 'M29 13.5v21', 'M34 17v14'],
  kettlebell: ['M19 17a5 5 0 0 1 10 0', 'M17 19h14a13 13 0 1 1-14 0Z'],
  pulse: ['M4 26h8l4-11 6 23 5-15 4 6h11'],
  flame: ['M24 6c6 8 12 11 12 20a12 12 0 0 1-24 0c0-5 3-8 6-11 0 4 2 6 4 7 2-5 2-11 2-16Z'],
  rings: ['M40 24a16 16 0 1 1-32 0 16 16 0 0 1 32 0', 'M33 24a9 9 0 1 1-18 0 9 9 0 0 1 18 0'],
  trophy: [
    'M15 9h18v9a9 9 0 0 1-18 0V9Z',
    'M15 12h-5v2.5a6 6 0 0 0 6 6M33 12h5v2.5a6 6 0 0 1-6 6',
    'M19.5 39h9M24 27v12',
  ],
  none: [],
};

/** Lado do viewBox dos glifos — usado para centralizá-los no canvas da capa. */
export const coverGlyphCanvas = 48;
