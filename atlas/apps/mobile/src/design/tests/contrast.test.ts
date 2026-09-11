import { it, expect } from 'vitest';
import { themes, glass, cover, coverPalettes, palette } from '@atlas/design-tokens';
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

/**
 * Texto sobre capa editorial (`HeroArtwork`, `CoverCard`).
 *
 * O fundo verificado é o **pixel mais claro que a arte vetorial consegue
 * produzir** — o tom claro da paleta aplicado pelo foco radial (`glowOpacity`)
 * e pela banda (`bandOpacity`) sobre o tom médio — e não uma média nem o tom
 * claro puro, que não chega a preencher região nenhuma. Esse é o piso real de
 * contraste, porque a arte está sempre desenhada sob a foto: se a imagem
 * editorial não carregar, é ela que fica.
 *
 * O véu é avaliado na sua parada **mais fraca sob texto** (a do meio): o
 * conteúdo sobreposto vive com `justifyContent: 'flex-end'`, então nunca sobe
 * acima dela, e tudo abaixo é mais escuro.
 *
 * **Limite conhecido e deliberado:** uma *fotografia* clara pode ser mais
 * clara que qualquer arte gerada, e nenhum degradê vertical sustenta AA sobre
 * branco sem escurecer o card inteiro a ponto de a foto deixar de ser foto.
 * A garantia ali é de direção de arte — imagem editorial escura — e está
 * registrada em `design/media/artwork.ts`.
 */
function blend(backdrop: number[], overlay: number[], alpha: number) {
  return backdrop.map((value, index) => value * (1 - alpha) + overlay[index]! * alpha);
}

/** Reproduz a pintura de `CoverArt`: base → foco radial → banda diagonal. */
function brightestArtPixel(colors: readonly string[]) {
  const [, mid, light] = colors;
  return blend(blend(rgb(mid!), rgb(light!), cover.glowOpacity), rgb(light!), cover.bandOpacity);
}

const SCRIM_INK = rgb('#0B0912');
/** Menor opacidade do véu que pode ficar atrás de texto — a parada do meio. */
const WEAKEST_SCRIM_UNDER_TEXT = Number(cover.scrim[1]!.match(/([\d.]+)\)$/)![1]);

it('texto sobre capa mantém 4,5:1 na pintura mais clara que a arte produz', () => {
  for (const entry of coverPalettes)
    expect(
      contrast(
        rgb(palette.ink900),
        blend(brightestArtPixel(entry.colors), SCRIM_INK, WEAKEST_SCRIM_UNDER_TEXT),
      ),
    ).toBeGreaterThanOrEqual(4.5);
});

it('chip sobre capa se sustenta sem depender do véu', () => {
  // `onCoverSurface` é rgba(11,9,18,0.55) e é desenhado no topo do card, onde o
  // véu ainda é transparente: ele precisa dar contraste sozinho.
  const chipAlpha = Number(cover.onCoverSurface.match(/([\d.]+)\)$/)![1]);
  for (const entry of coverPalettes)
    expect(
      contrast(rgb(palette.ink900), blend(brightestArtPixel(entry.colors), SCRIM_INK, chipAlpha)),
    ).toBeGreaterThanOrEqual(4.5);
});

it('o véu termina praticamente opaco, para a capa se dissolver na página', () => {
  expect(cover.scrimStops.at(-1)).toBe(1);
  expect(cover.scrim.at(-1)).toContain('0.94');
});
