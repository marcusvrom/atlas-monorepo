import { useMemo } from 'react';
import type { ExerciseMedia } from '@atlas/contracts';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { motion, spacing, radius } from '@atlas/design-tokens';
import { useVideoPlayer, VideoView } from 'expo-video';
import { usableMediaUri } from '../../lib/media';
import { Text } from '../../design/components';
import { useTheme } from '../../design/theme-provider';
import { t } from '../../i18n';

/**
 * ATL-UI-014 — demonstração em vídeo, quando ela existe.
 *
 * Vídeo/loop real tem prioridade. Quando ele ainda não existe, o componente
 * apresenta o par de imagens inicial/final do banco público. Sem qualquer
 * mídia válida, não ocupa espaço: os passos textuais continuam sendo o guia.
 */
export function ExerciseVideo({
  media,
  exerciseName,
}: {
  media: ExerciseMedia[];
  exerciseName: string;
}) {
  const { colors } = useTheme();
  const video = media.find((item) => item.kind === 'loop' || item.kind === 'video');
  const images = media.filter((item) => item.kind === 'image').slice(0, 2);
  const source = usableMediaUri(video?.url ?? null);
  const player = useVideoPlayer(source, (instance) => {
    instance.loop = true;
    instance.muted = true;
    if (source) instance.play();
  });
  const styles = useMemo(
    () =>
      StyleSheet.create({
        video: { height: spacing.huge * 3, width: '100%', borderRadius: radius.lg },
        gallery: { gap: spacing.md },
        frames: { flexDirection: 'row', gap: spacing.md },
        frame: { flex: 1, gap: spacing.xs },
        image: {
          width: '100%',
          aspectRatio: 1,
          borderRadius: radius.lg,
          backgroundColor: colors.surface,
        },
      }),
    [colors],
  );
  if (source) return <VideoView player={player} style={styles.video} nativeControls={false} />;
  if (!images.length) return null;

  return (
    <View style={styles.gallery}>
      <Text weight="bold">{t('catalogDemonstration')}</Text>
      <View style={styles.frames}>
        {images.map((item, index) => {
          const uri = usableMediaUri(item.url);
          if (!uri) return null;
          const position = index === 0 ? t('catalogStartPosition') : t('catalogEndPosition');
          return (
            <View key={item.url} style={styles.frame}>
              <Image
                source={{ uri }}
                style={styles.image}
                contentFit="contain"
                transition={motion.duration.base}
                cachePolicy="memory-disk"
                accessible
                accessibilityLabel={`${exerciseName}: ${position}`}
              />
              <Text variant="caption" tone="secondary">
                {position}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
