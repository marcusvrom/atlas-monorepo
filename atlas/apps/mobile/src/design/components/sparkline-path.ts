export function sparklinePath(
  values: readonly number[],
  width: number,
  height: number,
  inset: number,
): string {
  const points = values.filter(Number.isFinite);
  if (points.length < 2) return '';
  const min = Math.min(...points),
    max = Math.max(...points);
  return points
    .map((value, index) => {
      const x = inset + (index / (points.length - 1)) * (width - inset * 2);
      const y =
        max === min
          ? height / 2
          : height - inset - ((value - min) / (max - min)) * (height - inset * 2);
      return (index === 0 ? 'M' : 'L') + x + ' ' + y;
    })
    .join(' ');
}

/**
 * Mesma linha fechada contra a base — recebe o preenchimento em gradiente.
 * Separada de `sparklinePath` porque o traço e a área têm pintura diferente:
 * aplicar `fill` no próprio traço fecharia a forma pela corda entre o primeiro
 * e o último ponto, desenhando uma área que não corresponde à série.
 */
export function sparklineArea(
  values: readonly number[],
  width: number,
  height: number,
  inset: number,
): string {
  const line = sparklinePath(values, width, height, inset);
  if (!line) return '';
  const base = height - inset;
  return `M${inset} ${base} ${line.replace(/^M/, 'L')} L${width - inset} ${base} Z`;
}

/**
 * Coordenada do último ponto da série — onde vai o marcador de "agora".
 * Calculada a partir dos valores, e não relida do `d` do traço: reparsear uma
 * string de path é frágil e quebra em silêncio se o formato mudar.
 */
export function sparklineHead(
  values: readonly number[],
  width: number,
  height: number,
  inset: number,
): { x: number; y: number } | null {
  const points = values.filter(Number.isFinite);
  if (points.length < 2) return null;
  const min = Math.min(...points),
    max = Math.max(...points);
  const last = points.at(-1)!;
  return {
    x: width - inset,
    y:
      max === min
        ? height / 2
        : height - inset - ((last - min) / (max - min)) * (height - inset * 2),
  };
}
