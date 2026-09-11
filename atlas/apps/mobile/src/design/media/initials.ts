/**
 * Iniciais para o retrato de uma pessoa sem foto.
 *
 * Módulo próprio, sem React Native, para poder ser testado: a suíte roda em
 * Node e não consegue carregar os tipos Flow do `react-native`. Mesma divisão
 * que `cover-art.ts` e `sparkline-path.ts` — a regra é testável, o desenho não.
 *
 * Usa a primeira letra do primeiro e do último nome. Nomes compostos
 * brasileiros ("Ana Paula dos Santos") passariam de duas letras se pegássemos
 * todas as palavras, e partículas ("dos") não identificam ninguém.
 */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '';
  const first = parts[0]![0] ?? '';
  const last = parts.length > 1 ? (parts.at(-1)![0] ?? '') : '';
  return (first + last).toUpperCase();
}
