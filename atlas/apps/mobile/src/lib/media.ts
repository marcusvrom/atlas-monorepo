/**
 * ATL-UI-013 — quando tentar carregar mídia remota.
 *
 * O modo mock usa o Free Exercise DB, um banco público de demonstrações. Essas
 * URLs podem carregar sem a API real; qualquer outra mídia continua reservada
 * ao modo HTTP para não transformar typos de fixture em falhas de rede.
 *
 * A decisão é de transporte, não de tela: nenhuma tela pergunta por isso
 * (R1); quem consulta é o componente de mídia do design system.
 */
export const remoteMediaEnabled = process.env.EXPO_PUBLIC_API_MODE === 'http';

const MOCK_MEDIA_ORIGIN = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/';

/** Retorna a URI só quando há chance real de ela resolver. */
export function usableMediaUri(uri: string | null | undefined): string | null {
  if (!uri) return null;
  return remoteMediaEnabled || uri.startsWith(MOCK_MEDIA_ORIGIN) ? uri : null;
}
