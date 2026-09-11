import { useMemo } from 'react';
import type { ExerciseMedia } from '@atlas/contracts';
import { StyleSheet } from 'react-native';
import { spacing, radius } from '@atlas/design-tokens';
import { useVideoPlayer, VideoView } from 'expo-video';
import { usableMediaUri } from '../../lib/media';

/**
 * ATL-UI-014 — demonstração em vídeo, quando ela existe.
 *
 * O comportamento de ausência mudou. Antes, sem mídia tocável, o componente
 * desenhava uma moldura vazia com o nome do arquivo do mock por baixo
 * ("supino-reto-barra/front.mp4"). Isso não lia como "ainda não temos vídeo" —
 * lia como *quebrado*, e ocupava o melhor espaço da tela para dizer isso.
 *
 * Agora o componente simplesmente não renderiza nada quando não há fonte. Quem
 * assume o lugar é `ExerciseSteps`, que mostra os pontos de execução como
 * sequência numerada: conteúdo real, que o catálogo já tinha e que estava
 * relegado ao pé da tela. Um app sem biblioteca de vídeo não precisa de uma
 * moldura de vídeo vazia — precisa de instrução.
 *
 * Quando a API real servir `media` de um CDN de verdade (`EXPO_PUBLIC_API_MODE=http`),
 * o vídeo volta a aparecer aqui sem nenhuma outra mudança.
 */
export function ExerciseVideo({ media }: { media: ExerciseMedia | undefined }) {
  const source = usableMediaUri(media?.url ?? null);
  const player = useVideoPlayer(source, (instance) => {
    instance.loop = true;
    instance.muted = true;
    if (source) instance.play();
  });
  const styles = useMemo(
    () =>
      StyleSheet.create({
        video: { height: spacing.huge * 3, width: '100%', borderRadius: radius.lg },
      }),
    [],
  );
  if (!source) return null;
  return <VideoView player={player} style={styles.video} nativeControls={false} />;
}
