/**
 * ATL-UI-013 — quando tentar carregar mídia remota.
 *
 * O catálogo mock semeia `thumbnailUrl` apontando para `cdn.atlas.example`,
 * um host que só passa a existir na fase de integração. Disparar essas
 * requisições em modo mock não traria imagem nenhuma e ainda custaria uma
 * falha de rede por linha de lista — por isso a capa gerada é a única fonte
 * enquanto `EXPO_PUBLIC_API_MODE` não for `http`.
 *
 * A decisão é de transporte, não de tela: nenhuma tela pergunta por isso
 * (R1); quem consulta é o componente de mídia do design system.
 */
export const remoteMediaEnabled = process.env.EXPO_PUBLIC_API_MODE === 'http';

/** Retorna a URI só quando há chance real de ela resolver. */
export function usableMediaUri(uri: string | null | undefined): string | null {
  return remoteMediaEnabled && uri ? uri : null;
}
